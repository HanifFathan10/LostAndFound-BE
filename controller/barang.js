import cloudinary from "../config/cloudinary.js";
import {
  createBarangModel,
  getAllBarangModel,
  getBarangByIdModel,
  updateBarangModel,
} from "../model/barang.js";
import db from "../config/database.js";

const uploadToCloudinary = async (input) => {
  const uploadSingle = (buffer) =>
    new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "lost_and_found_uts" },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      stream.end(buffer);
    });

  if (!input) return null;

  if (Array.isArray(input)) {
    const buffers = input.map((f) => (f && f.buffer ? f.buffer : f));
    const urls = await Promise.all(buffers.map((b) => uploadSingle(b)));
    return urls;
  }

  const buffer = input && input.buffer ? input.buffer : input;
  const url = await uploadSingle(buffer);
  return url;
};

const getPublicIdFromUrl = (url) => {
  try {
    const parts = url.split("/");
    const fileNameWithExt = parts[parts.length - 1];
    const publicId = fileNameWithExt.split(".")[0];

    return `lost_and_found_uts/${publicId}`;
  } catch (error) {
    console.warn("Gagal parse public_id dari URL:", url, error);
    return null;
  }
};

export const perpanjangExp = async (req, res) => {
  const { id } = req.params;
  const id_user = req.user;

  try {
    const sql = `
      UPDATE Barang 
      SET 
        tanggal_kadaluarsa = DATE_ADD(NOW(), INTERVAL 2 DAY),
        status = 'masih dicari'
      WHERE id_barang = ? AND id_user = ?
    `;

    const [result] = await db.execute(sql, [id, id_user]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "fail",
        message:
          "Gagal memperpanjang. Barang tidak ditemukan atau bukan milik Anda.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Masa aktif laporan berhasil diperpanjang 2 hari ke depan.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

const formatBarangResponse = (row) => {
  return {
    id_barang: row.id_barang,
    judul_laporan: row.judul_laporan,
    deskripsi: row.deskripsi,
    lokasi: row.lokasi,
    tanggal: row.tanggal,
    foto: row.foto,
    tipe_laporan: row.tipe_laporan,
    status: row.status,
    tanggal_kadaluarsa: row.tanggal_kadaluarsa,
    created_at: row.created_at,
    updated_at: row.updated_at,

    pelapor: {
      id: row.id_user,
      nama: row.nama_pelapor,
      npm: row.npm_pelapor,
      email: row.email_pelapor,
      no_hp: row.no_hp_pelapor,
    },

    satpam: row.nama_satpam
      ? {
          nama: row.nama_satpam,
          kta: row.KTA,
        }
      : null,

    pengambilan: row.id_konfirmasi
      ? {
          id_konfirmasi: row.id_konfirmasi,
          nama_pengambil: row.nama_pengambil,
          npm_pengambil: row.npm_pengambil,
          prodi_pengambil: row.prodi_pengambil,
          no_hp_pengambil: row.no_hp_pengambil,
          foto_bukti: row.foto_bukti,
          catatan: row.catatan_pengambilan,
          waktu: row.waktu_pengambilan,
        }
      : null,
  };
};

// CRUD

export const getAllBarang = async (req, res) => {
  const { search } = req.query;

  try {
    const rawData = await getAllBarangModel(search);

    const formattedData = rawData.map(formatBarangResponse);

    return res.status(200).json({
      status: "success",
      message: "Sukses mengambil semua data barang",
      data: formattedData,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message || "Terjadi kesalahan server",
    });
  }
};

export const getBarangById = async (req, res) => {
  try {
    const barangId = req.params.id;

    const rawData = await getBarangByIdModel(barangId);

    if (!rawData) {
      return res.status(404).json({
        status: "error",
        message: "Barang tidak ditemukan",
      });
    }

    const formattedData = formatBarangResponse(rawData);

    return res.status(200).json({
      status: "success",
      message: `Sukses mengambil data barang ${formattedData.judul_laporan}`,
      data: formattedData,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

export const createBarang = async (req, res) => {
  try {
    const userId = req.user;
    const data = req.body;

    let fotoUrls = [];

    if (req.files && req.files.length > 0) {
      console.log(`Uploading ${req.files.length} files to Cloudinary...`);
      const uploadResult = await uploadToCloudinary(req.files);

      fotoUrls = Array.isArray(uploadResult) ? uploadResult : [uploadResult];

      console.log("Upload success:", fotoUrls);
    } else if (req.file) {
      const url = await uploadToCloudinary(req.file.buffer);
      fotoUrls = [url];
    }

    const fotoString = JSON.stringify(fotoUrls);

    const dataLaporan = {
      ...data,
      foto: fotoString,
      tanggal_kadaluarsa: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      id_satpam: data.id_data_satpam || null,
      id_user: userId,
    };

    const newBarangId = await createBarangModel(dataLaporan);

    return res.status(201).json({
      status: "success",
      message: "Sipp, laporan kamu sudah dibuat, mohon bersabar yaaa",
      data: { id: newBarangId, ...dataLaporan },
    });
  } catch (error) {
    console.error("Error saat membuat laporan:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const updateBarang = async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  if (!id) {
    return res.status(400).json({ message: "ID Barang di URL wajib ada." });
  }

  try {
    const barangLama = await getBarangByIdModel(id);
    if (!barangLama) {
      return res
        .status(404)
        .json({ status: "Not Found", message: "Barang tidak ditemukan" });
    }

    let newFotoUrl = barangLama.foto;

    if (req.file) {
      console.log("File baru terdeteksi, meng-upload ke Cloudinary...");
      newFotoUrl = await uploadToCloudinary(req.file.buffer);

      if (barangLama.foto) {
        console.log("Menghapus foto lama dari Cloudinary...");
        const publicId = getPublicIdFromUrl(barangLama.foto);
        if (publicId) {
          cloudinary.uploader
            .destroy(publicId)
            .catch((err) => console.error("Gagal hapus foto lama:", err));
        }
      }
    }

    const dataLengkap = {
      judul_laporan: data.judul_laporan || barangLama.judul_laporan,
      deskripsi: data.deskripsi || barangLama.deskripsi,
      lokasi: data.lokasi || barangLama.lokasi,
      tanggal: data.tanggal || barangLama.tanggal,
      tipe_laporan: data.tipe_laporan || barangLama.tipe_laporan,
      status: data.status || barangLama.status,
      nama_satpam: data.nama_satpam || barangLama.nama_satpam,
      foto: newFotoUrl,
    };

    const affectedRows = await updateBarangModel(id, dataLengkap);

    if (affectedRows === 0) {
      return res.status(404).json({
        message: "Barang tidak ditemukan atau tidak ada data yang berubah",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Laporan barang berhasil diperbarui",
      data: { id: id, ...dataLengkap },
    });
  } catch (error) {
    console.error("Error saat update laporan:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const deleteBarang = async (req, res) => {
  const { id_barang } = req.params;

  if (!id_barang) {
    return res
      .status(400)
      .json({ status: "error", message: "ID Barang di URL wajib ada." });
  }

  try {
    const barang = await getBarangByIdModel(id_barang);
    if (!barang) {
      return res
        .status(404)
        .json({ status: "error", message: "Barang tidak ditemukan" });
    }

    if (barang.foto) {
      const fotos = JSON.parse(barang.foto);
      const fotoArray = Array.isArray(fotos) ? fotos : [fotos];

      console.log("Menghapus foto dari Cloudinary...");
      for (const fotoUrl of fotoArray) {
        const publicId = getPublicIdFromUrl(fotoUrl);
        if (publicId) {
          await cloudinary.uploader
            .destroy(publicId)
            .catch((err) => console.error("Gagal hapus foto:", err));
        }
      }
      console.log("Foto berhasil dihapus dari Cloudinary.");
    }

    const sql = "DELETE FROM Barang WHERE id_barang = ?";
    const [result] = await db.execute(sql, [id_barang]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Barang tidak ditemukan" });
    }

    return res.status(200).json({
      status: "success",
      message: "Barang berhasil dihapus!",
    });
  } catch (error) {
    console.error("Error saat delete laporan:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};
