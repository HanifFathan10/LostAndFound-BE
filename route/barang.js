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

const router = express.Router();

router.get("/barang", getAllBarang);
router.get("/barang/:id", getBarangById);
router.post("/barang", [uploadMiddleware, auth], createBarang);
router.put("/barang/:id", [uploadMiddleware, auth], updateBarang);
router.patch("/barang/:id/perpanjang", [auth], perpanjangExp);

export default router;
