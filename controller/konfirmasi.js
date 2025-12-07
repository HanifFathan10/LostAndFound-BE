import cloudinary from "../config/cloudinary.js";
import { createKonfirmasiModel } from "../model/konfirmasi.js";
import { getBarangByIdModel } from "../model/barang.js"; // Reuse model barang buat cek data

// --- Helper Upload (Sama seperti di barang.js) ---
const uploadToCloudinary = async (input) => {
  const uploadSingle = (buffer) =>
    new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "lost_and_found_konfirmasi" }, // Folder khusus konfirmasi
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      stream.end(buffer);
    });

  if (!input) return null;

  // Handle Multiple Files
  if (Array.isArray(input)) {
    const buffers = input.map((f) => (f && f.buffer ? f.buffer : f));
    const urls = await Promise.all(buffers.map((b) => uploadSingle(b)));
    return urls;
  }

  // Single File
  const buffer = input && input.buffer ? input.buffer : input;
  const url = await uploadSingle(buffer);
  return url;
};

// --- Main Controller ---
export const createKonfirmasi = async (req, res) => {
  const { id_barang } = req.params;
  const data = req.body;

  try {
    const barang = await getBarangByIdModel(id_barang);
    if (!barang) {
      return res
        .status(404)
        .json({ status: "error", message: "Barang tidak ditemukan" });
    }

    if (barang.status === "sudah selesai") {
      return res.status(400).json({
        status: "error",
        message: "Barang ini sudah diambil sebelumnya.",
      });
    }

    let fotoUrls = [];
    if (req.files && req.files.length > 0) {
      console.log(`Mengupload ${req.files.length} bukti foto...`);
      const uploadResult = await uploadToCloudinary(req.files);
      // Pastikan hasil selalu array
      fotoUrls = Array.isArray(uploadResult) ? uploadResult : [uploadResult];
    } else {
      return res.status(400).json({
        status: "error",
        message: "Foto bukti pengambilan wajib diupload.",
      });
    }

    const dataKonfirmasi = {
      id_barang: id_barang,
      nama_pengambil: data.nama_pengambil,
      npm_pengambil: data.npm_pengambil,
      prodi_pengambil: data.prodi_pengambil,
      no_hp_pengambil: data.no_hp_pengambil,
      foto_bukti: JSON.stringify(fotoUrls),
      catatan: data.catatan,
    };

    await createKonfirmasiModel(dataKonfirmasi);

    return res.status(201).json({
      status: "success",
      message:
        "Konfirmasi pengambilan berhasil disimpan. Status barang diperbarui.",
      data: dataKonfirmasi,
    });
  } catch (error) {
    console.error("Error konfirmasi:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};
