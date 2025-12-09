import db from "../config/database.js";

export const getAllSatpamModel = async (search) => {
  let sql = "SELECT * FROM Satpam";

  const params = [];

  if (search) {
    sql += " WHERE (nama_satpam LIKE ? OR KTA LIKE ?)";

    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }

  try {
    const [rows] = await db.execute(sql, params);
    return rows;
  } catch (error) {
    console.error("Error di getAllBarangModel:", error);
    throw new Error(error.message);
  }
};

export const getSatpamByName = async (name) => {
  const sql = `SELECT * FROM Satpam WHERE nama_satpam = ?`;
  const [rows] = await db.execute(sql, [name]);

  return rows[0] || null;
};

export const getSatpamByIdModel = async (id) => {
  console.log("🚀 ~ getSatpamByIdModel ~ id:", id);
  const sql = `SELECT * FROM User WHERE user_id = ?`;
  const [rows] = await db.execute(sql, [id]);
  return rows[0];
};

export const createSatpamModel = async (data) => {
  const sql = `INSERT INTO Satpam (nama_satpam, KTA)
                  VALUES (?, ?)`;
  try {
    const [result] = await db.execute(sql, [data.nama_satpam, data.KTA]);
    return result.insertId;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const deleteSatpamModel = async (id) => {
  const sql = `DELETE FROM Satpam WHERE satpam_id = ?`;
  try {
    const [result] = await db.execute(sql, [id]);
    return result.affectedRows;
  } catch (error) {
    throw new Error(error.message);
  }
};
