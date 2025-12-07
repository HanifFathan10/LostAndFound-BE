import express from "express";
import {
  createBarang,
  getAllBarang,
  getBarangById,
  perpanjangExp,
  updateBarang,
} from "../controller/barang.js";
import uploadMiddleware from "../middleware/upload.js";
import auth from "../middleware/auth.js";
import { createKonfirmasi } from "../controller/konfirmasi.js";

const router = express.Router();

router.get("/barang", getAllBarang);
router.get("/barang/:id", getBarangById);
router.post("/barang", [uploadMiddleware, auth], createBarang);
router.patch("/barang/:id", [uploadMiddleware, auth], updateBarang);
router.patch("/barang/:id/perpanjang", [auth], perpanjangExp);
router.post(
  "/barang/:id_barang/konfirmasi",
  [uploadMiddleware, auth],
  createKonfirmasi
);

export default router;
