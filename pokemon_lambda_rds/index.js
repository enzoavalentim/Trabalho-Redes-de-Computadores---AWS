const https = require("https");
const mysql = require("mysql2/promise");

exports.handler = async (event) => {
  try {
    const pokemon = event.queryStringParameters?.name || "pikachu";

    // 🔹 Busca dados do Pokémon na PokéAPI
    const data = await fetchPokemon(pokemon);

    // 🔹 Coleta as fraquezas
    const typeUrls = (data.types || []).map((t) => t.type.url);
    const weaknesses = typeUrls.length
      ? await fetchWeaknessesFromTypes(typeUrls)
      : [];

    // 🔹 Normaliza o formato dos dados
    const normalized = normalizeData(data, weaknesses);

    // 🧩 Grava o Pokémon no banco RDS
    await saveToRDS(normalized);

    // 🔹 Retorna uma confirmação simples
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: `Pokémon ${pokemon} salvo com sucesso no RDS.`,
      }),
    };

  } catch (error) {
    console.error("Erro Lambda:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// ===============================
// 🔹 Função para buscar dados da PokéAPI
// ===============================
function fetchPokemon(name) {
  return new Promise((resolve, reject) => {
    https.get(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(name)}`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(`Pokémon ${name} não encontrado. StatusCode: ${res.statusCode}`));
        }
      });
    }).on("error", reject);
  });
}

// ===============================
// 🔹 Função para buscar fraquezas
// ===============================
async function fetchWeaknessesFromTypes(typeUrls) {
  const promises = typeUrls.map((url) =>
    fetchType(url)
      .then((typeJson) => {
        const arr = (typeJson?.damage_relations?.double_damage_from || []).map(
          (d) => d.name
        );
        return arr;
      })
      .catch((e) => {
        console.warn("Erro buscando type url:", url, e);
        return [];
      })
  );

  const arrays = await Promise.all(promises);
  const merged = arrays.flat();
  const unique = [...new Set(merged)];
  return unique;
}

// ===============================
// 🔹 Busca JSON do tipo
// ===============================
function fetchType(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(`Type URL ${url} retornou status ${res.statusCode}`));
        }
      });
    }).on("error", reject);
  });
}

// ===============================
// 🔹 Normaliza os dados do Pokémon
// ===============================
function normalizeData(p, weaknesses = []) {
  const urlRegex = /^(https?:\/\/[^\s]+)$/i;
  return {
    id: p.id,
    name: (p.name || "").toLowerCase(),
    types: (p.types || []).map((t) => t.type.name),
    sprite: urlRegex.test(p.sprites?.front_default)
      ? p.sprites.front_default
      : null,
    height: `${(p.height ?? 0) / 10} m`,
    weight: `${(p.weight ?? 0) / 10} kg`,
    weaknesses: weaknesses,
    fetchedAt: new Date().toISOString(),
  };
}

// ===============================
// 💾 Grava no MySQL (Amazon RDS)
// ===============================
async function saveToRDS(pokemon) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  const query = `
    INSERT INTO pokemons (id, name, types, height, weight, weaknesses, sprite)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      types = VALUES(types),
      height = VALUES(height),
      weight = VALUES(weight),
      weaknesses = VALUES(weaknesses),
      sprite = VALUES(sprite);
  `;

  const values = [
    pokemon.id,
    pokemon.name,
    pokemon.types.join(", "),
    pokemon.height,
    pokemon.weight,
    pokemon.weaknesses.join(", "),
    pokemon.sprite, // 🔹 agora armazenamos o link da imagem também
  ];

  await connection.execute(query, values);
  await connection.end();

  console.log(`✅ Pokémon ${pokemon.name} salvo no RDS com sucesso.`);
}
