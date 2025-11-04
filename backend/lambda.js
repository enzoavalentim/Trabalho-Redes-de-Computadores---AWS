import https from "https";

export const handler = async (event) => {
  try {
    const pokemon = event.queryStringParameters?.name || "pikachu";

    const data = await fetchPokemon(pokemon);

    const normalized = normalizeData(data);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", 
      },
      body: JSON.stringify(normalized),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro ao buscar Pokémon" }),
    };
  }
};

function fetchPokemon(name) {
  return new Promise((resolve, reject) => {
    https.get(`https://pokeapi.co/api/v2/pokemon/${name}`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Pokémon ${name} não encontrado.`));
        }
      });
    }).on("error", reject);
  });
}


function normalizeData(p) {
  const urlRegex = /^(https?:\/\/[^\s]+)$/i;

  return {
    id: p.id,
    name: p.name.toLowerCase(),
    types: p.types.map((t) => t.type.name),
    sprite: urlRegex.test(p.sprites.front_default)
      ? p.sprites.front_default
      : null,
    height: `${p.height / 10} m`,
    weight: `${p.weight / 10} kg`,
  };
}
