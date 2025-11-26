import cloudinary from "../config/cloudinary.js";
import {
  createSatpamModel,
  getAllSatpamModel,
  getSatpamByIdModel,
  deleteSatpamModel,
} from "../model/satpam.js";

const uploadToCloudinary = async (input) => {
  const uploadSingle = (buffer) =>
    new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "lost_and_found_satpam" },
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

    return `lost_and_found_satpam/${publicId}`;
  } catch (error) {
    console.warn("Gagal parse public_id dari URL:", url, error);
    return null;
  }
};

export const getAllSatpam = async (req, res) => {
  const { search } = req.query;

  try {
    const semuaSatpam = await getAllSatpamModel(search);

    return res.status(200).json({
      status: "Sukses mengambil semua data satpam",
      data: semuaSatpam,
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

export const getSatpamById = async (req, res) => {
  try {
    const satpamId = req.params.id;

    const satpam = await getSatpamByIdModel(satpamId);

    if (!satpam) {
      return res.status(404).json({
        status: "error",
        message: "Satpam tidak ditemukan",
      });
    }

    return res.status(200).json({
      status: `Sukses mengambil data ${satpam.nama_satpam}`,
      data: satpam,
    });
  } catch (error) {
    return res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

export const createSatpam = async (req, res) => {
  try {
    const data = req.body;

    let fotoUrls = [];

    if (req.files && req.files.length > 0) {
      console.log(`Uploading ${req.files.length} KTA files to Cloudinary...`);

      const uploadResult = await uploadToCloudinary(req.files);

      fotoUrls = Array.isArray(uploadResult) ? uploadResult : [uploadResult];

      console.log("Upload success:", fotoUrls);
    } else if (req.file) {
      const url = await uploadToCloudinary(req.file.buffer);
      fotoUrls = [url];
    }

    const fotoString = JSON.stringify(fotoUrls);

    const dataLaporan = {
      nama_satpam: data.nama_satpam,
      KTA: fotoString,
    };

    const newSatpamId = await createSatpamModel(dataLaporan);

    res.status(201).json({
      status: "success",
      message: "Identitas satpam berhasil dibuat",
      data: {
        id: newSatpamId,
        ...dataLaporan,
        KTA: fotoUrls,
      },
    });
  } catch (error) {
    console.error("Error saat membuat laporan:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const deleteSatpam = async (req, res) => {
  try {
    const satpamId = req.params.id;
    const satpam = await getSatpamByIdModel(satpamId);

    if (!satpam) {
      return res.status(404).json({
        status: "error",
        message: "Satpam tidak ditemukan",
      });
    }

    if (satpam.KTA) {
      const ktaArray = JSON.parse(satpam.KTA);
      if (Array.isArray(ktaArray)) {
        for (const ktaUrl of ktaArray) {
          const publicId = getPublicIdFromUrl(ktaUrl);
          console.log("Deleting from Cloudinary, publicId:", publicId);
          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
          }
        }
      }
    }

    const deletedRows = await deleteSatpamModel(satpamId);
    if (deletedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "Satpam tidak ditemukan untuk dihapus",
      });
    }
    return res.status(200).json({
      status: "success",
      message: `Satpam dengan ID ${satpamId} berhasil dihapus`,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
