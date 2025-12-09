import express from "express";
import {
  getAllKonfirmasiBarang,
  getKonfirmasiBarangById,
} from "../controller/konfirmasi.js";

const router = express.Router();

router.get("/konfirmasi", getAllKonfirmasiBarang);
router.get("/konfirmasi/:id", getKonfirmasiBarangById);

export default router;
