const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "api_platform",
  password: "1234", // put your REAL postgres password here
  port: 5432,
});

pool.connect()
  .then(() => {
    console.log("PostgreSQL connected successfully");
  })
  .catch((err) => {
    console.error("Database connection error:", err.message);
  });

module.exports = pool;