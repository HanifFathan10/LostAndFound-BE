import db from "../config/database.js";

export const getAllBarangModel = async (search) => {
  let sql = "SELECT * FROM Barang";

  const params = [];

  if (search) {
    sql += " WHERE (judul_laporan LIKE ? OR deskripsi LIKE ? OR lokasi LIKE ?)";

    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  sql += " ORDER BY created_at DESC";

  try {
    const [rows] = await db.execute(sql, params);
    return rows;
  } catch (error) {
    console.error("Error di getAllBarangModel:", error);
    throw new Error(error.message);
  }
};

export const getBarangByIdModel = async (id) => {
  const sql = `SELECT * FROM Barang WHERE id_barang = ?`;
  const [rows] = await db.execute(sql, [id]);
  return rows[0];
};

export const createBarangModel = async (data) => {
  const sql = `INSERT INTO Barang (judul_laporan, deskripsi, lokasi, tanggal, foto, tipe_laporan, status, tanggal_kadaluarsa, id_satpam, id_user)
                  VALUES (?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 3 DAY), ?, ?)`;

  try {
    const [result] = await db.execute(sql, [
      data.judul_laporan,
      data.deskripsi,
      data.lokasi,
      data.tanggal,
      data.foto,
      data.tipe_laporan,
      data.status || "masih dicari",
      data.id_satpam,
      data.id_user,
    ]);

    return result.insertId;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const updateBarangModel = async (id, data) => {
  const sql = `UPDATE Barang SET 
                 judul_laporan = ?, 
                 deskripsi = ?, 
                 lokasi = ?, 
                 tanggal = ?, 
                 foto = ?, 
                 tipe_laporan = ?, 
                 status = ?
               WHERE id_barang = ?`;

  try {
    const [result] = await db.execute(sql, [
      data.judul_laporan,
      data.deskripsi,
      data.lokasi,
      data.tanggal,
      data.foto,
      data.tipe_laporan,
      data.status,
      id,
    ]);
    return result.affectedRows;
  } catch (error) {
    console.error("Error di dalam updateBarangModel statis:", error);
    throw new Error(error.message);
  }
};
