import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST, // Jangan tulis 'localhost'
  user: process.env.DB_USER, // Jangan tulis 'root'
  password: process.env.DB_PASSWORD, // Jangan kosongkan
  database: process.env.DB_NAME, // Nama database di Aiven (biasanya defaultdb)
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default pool;
