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

  // Single buffer or file object
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

// CRUD

export const getAllBarang = async (req, res) => {
  const { search } = req.query;

  try {
    const semuaBarang = await getAllBarangModel(search);

    return res.status(200).json({
      status: "Sukses mengambil semua data barang",
      data: semuaBarang,
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

export const getBarangById = async (req, res) => {
  try {
    const barangId = req.params.id;

    const barang = await getBarangByIdModel(barangId);

    if (!barang) {
      return res.status(404).json({
        status: "error",
        message: "Barang tidak ditemukan",
      });
    }

    return res.status(200).json({
      status: `Sukses mengambil data barang ${barang.judul_laporan}`,
      data: barang,
    });
  } catch (error) {
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
      id_user: userId,
    };

    const newBarangId = await createBarangModel(dataLaporan);

    return res.status(201).json({
      status: "success",
      message: "Laporan barang berhasil dibuat",
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
      return res.status(404).json({ message: "Barang tidak ditemukan" });
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
