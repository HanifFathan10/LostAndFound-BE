import db from "../config/database.js";

export const createKonfirmasiModel = async (data) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const sqlInsert = `
      INSERT INTO KonfirmasiPengambilan 
      (id_barang, nama_pengambil, npm_pengambil, prodi_pengambil, no_hp_pengambil, foto_bukti, catatan)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(sqlInsert, [
      data.id_barang,
      data.nama_pengambil,
      data.npm_pengambil,
      data.prodi_pengambil,
      data.no_hp_pengambil,
      data.foto_bukti,
      data.catatan || null,
    ]);

    const sqlUpdateBarang = `
      UPDATE Barang 
      SET status = 'sudah selesai', tipe_laporan = 'selesai'
      WHERE id_barang = ?
    `;
    await connection.execute(sqlUpdateBarang, [data.id_barang]);

    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
