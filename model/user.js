import db from "../config/database.js";
import bcrypt from "bcrypt";

export const getAllUsers = async () => {
  const sql = `SELECT * FROM User`;
  const [rows] = await db.execute(sql);
  return rows;
};

export const getUserByEmail = async (email) => {
  const sql = `SELECT * FROM User WHERE email = ?`;
  const [rows] = await db.execute(sql, [email]);

  return rows[0] || null;
};

export const createUser = async (data) => {
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(data.password, salt);

  const sql = `INSERT INTO User (npm, nama_lengkap, email, password, program_studi, role, no_hp)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

  try {
    const [result] = await db.execute(sql, [
      data.npm,
      data.nama_lengkap,
      data.email,
      hashPassword,
      data.program_studi,
      data.role || "Mahasiswa",
      data.no_hp,
    ]);

    return result.insertId;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const loginUser = async (data) => {
  const sql = `SELECT * FROM User WHERE email = ?`;

  try {
    const [rows] = await db.execute(sql, [data.email]);
    const user = rows[0];

    if (user) {
      const isPasswordValid = await bcrypt.compare(
        data.password,
        user.password
      );
      if (isPasswordValid) {
        delete user.password;
        return user;
      }
    } else {
      return null;
    }
  } catch (error) {
    throw new Error(error.message);
  }
};
