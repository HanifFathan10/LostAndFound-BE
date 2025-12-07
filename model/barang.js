import db from "../config/database.js";

export const getAllBarangModel = async (search) => {
  let sql = `
    SELECT 
      b.*, 
      u.nama_lengkap,
      u.npm, 
      u.email, 
      u.no_hp,
      s.nama_satpam, 
      s.KTA
    FROM Barang b
    LEFT JOIN User u ON b.id_user = u.user_id
    LEFT JOIN Satpam s ON b.id_satpam = s.satpam_id
  `;

  const params = [];

  if (search) {
    sql +=
      " WHERE (b.judul_laporan LIKE ? OR b.deskripsi LIKE ? OR b.lokasi LIKE ?)";
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  sql += " ORDER BY b.created_at DESC";

  try {
    const [rows] = await db.execute(sql, params);
    return rows;
  } catch (error) {
    console.error("Error di getAllBarangModel:", error);
    throw new Error(error.message);
  }
};

export const getBarangByIdModel = async (id) => {
  const sql = `
    SELECT 
      b.*, 
      u.nama_lengkap,
      u.npm, 
      u.email, 
      u.no_hp,
      s.nama_satpam, 
      s.KTA
    FROM Barang b
    LEFT JOIN User u ON b.id_user = u.user_id
    LEFT JOIN Satpam s ON b.id_satpam = s.satpam_id
    WHERE b.id_barang = ?
  `;

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
