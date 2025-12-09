import db from "../config/database.js";

export const getAllBarangModel = async (search) => {
  let sql = `
    SELECT 
      b.*, 
      -- Data Pelapor (User)
      u.nama_lengkap AS nama_pelapor,
      u.npm AS npm_pelapor, 
      u.email AS email_pelapor, 
      u.no_hp AS no_hp_pelapor,
      
      -- Data Satpam (Opsional)
      s.nama_satpam, 
      s.KTA,

      -- Data Konfirmasi Pengambilan (Jika sudah diambil)
      k.id_konfirmasi,
      k.nama_pengambil,
      k.npm_pengambil,
      k.prodi_pengambil,
      k.no_hp_pengambil,
      k.foto_bukti,
      k.catatan AS catatan_pengambilan,
      k.waktu_pengambilan

    FROM Barang b
    LEFT JOIN User u ON b.id_user = u.user_id
    LEFT JOIN Satpam s ON b.id_satpam = s.satpam_id
    LEFT JOIN KonfirmasiPengambilan k ON b.id_barang = k.id_barang 
  `;

  const params = [];

  if (search) {
    sql +=
      " WHERE (b.judul_laporan LIKE ? OR b.deskripsi LIKE ? OR b.lokasi LIKE ?)";
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  sql +=
    " ORDER BY FIELD(b.tipe_laporan, 'hilang', 'ditemukan', 'selesai'), b.created_at DESC";

  try {
    const [rows] = await db.execute(sql, params);
    return rows;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getBarangByIdModel = async (id) => {
  const sql = `
    SELECT 
      b.*, 
      -- Data Pelapor
      u.nama_lengkap AS nama_pelapor,
      u.npm AS npm_pelapor, 
      u.email AS email_pelapor, 
      u.no_hp AS no_hp_pelapor,
      
      -- Data Satpam
      s.nama_satpam, 
      s.KTA,

      -- Data Pengambil
      k.id_konfirmasi,
      k.nama_pengambil,
      k.npm_pengambil,
      k.prodi_pengambil,
      k.no_hp_pengambil,
      k.foto_bukti,
      k.catatan AS catatan_pengambilan,
      k.waktu_pengambilan

    FROM Barang b
    LEFT JOIN User u ON b.id_user = u.user_id
    LEFT JOIN Satpam s ON b.id_satpam = s.satpam_id
    LEFT JOIN KonfirmasiPengambilan k ON b.id_barang = k.id_barang
    WHERE b.id_barang = ?
  `;

  try {
    const [rows] = await db.execute(sql, [id]);
    return rows[0];
  } catch (error) {
    throw new Error(error.message);
  }
};

export const createBarangModel = async (data) => {
  const sql = `INSERT INTO Barang (judul_laporan, deskripsi, lokasi, tanggal, foto, tipe_laporan, status, tanggal_kadaluarsa, id_satpam, id_user)
                  VALUES (?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 3 DAY), ?, ?)`;

  try {
    let tanggalMySQL = data.tanggal.replace("T", " ");

    if (tanggalMySQL.length === 16) {
      tanggalMySQL += ":00";
    } else {
      tanggalMySQL = tanggalMySQL.slice(0, 19);
    }

    const [result] = await db.execute(sql, [
      data.judul_laporan,
      data.deskripsi,
      data.lokasi,
      tanggalMySQL,
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
    throw new Error(error.message);
  }
};
