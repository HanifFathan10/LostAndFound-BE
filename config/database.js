import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST, // Jangan tulis 'localhost'
  user: process.env.MYSQL_USER, // Jangan tulis 'root'
  password: process.env.MYSQL_PASSWORD, // Jangan kosongkan
  database: process.env.MYSQL_DATABASE, // Nama database di Aiven (biasanya defaultdb)
  port: process.env.PORT || 3306,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  connectTimeout: 60000,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default pool;
