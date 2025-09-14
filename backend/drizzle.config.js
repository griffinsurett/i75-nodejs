// ==================== drizzle.config.js ====================
require('dotenv').config();

module.exports = {
  schema: "./config/schema.js",
  out: "./migrations",
  dialect: "postgresql", // Changed from "driver: pg"
  dbCredentials: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: false,
  }
};