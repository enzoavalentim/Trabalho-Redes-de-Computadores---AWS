const mysql = require("mysql2/promise");

exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    const id = params.id ? parseInt(params.id) : null;
    const name = params.name ? params.name.toLowerCase() : null;

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });

    let query = "SELECT * FROM pokemons";
    let values = [];

    // Filtra por id ou nome (busca exata ou parcial)
    if (id) {
      query += " WHERE id = ?";
      values = [id];
    } else if (name) {
      // busca parcial (ex: name LIKE '%char%')
      query += " WHERE LOWER(name) LIKE ?";
      values = [`%${name}%`];
    }

    const [rows] = await connection.execute(query, values);
    await connection.end();

    if (rows.length === 0) {
      return {
        statusCode: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "Pokémon não encontrado." }),
      };
    }

    // Normaliza os campos (types e weaknesses para array)
    const formatted = rows.map((r) => ({
      id: r.id,
      name: r.name,
      types: r.types ? r.types.split(",").map((t) => t.trim()) : [],
      sprite: r.sprite || null,
      height: r.height,
      weight: r.weight,
      weaknesses: r.weaknesses
        ? r.weaknesses.split(",").map((w) => w.trim())
        : [],
    }));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(formatted),
    };

  } catch (error) {
    console.error("Erro Lambda leitura:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
