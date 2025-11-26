import express from "express";
import uploadMiddleware from "../middleware/upload.js";
import {
  createSatpam,
  deleteSatpam,
  getAllSatpam,
  getSatpamById,
} from "../controller/satpam.js";

const router = express.Router();

router.get("/satpam", getAllSatpam);
router.get("/satpam/:id", getSatpamById);
router.post("/satpam", uploadMiddleware, createSatpam);
router.delete("/satpam/:id", uploadMiddleware, deleteSatpam);

export default router;
