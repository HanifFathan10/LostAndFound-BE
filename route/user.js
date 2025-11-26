import express from "express";
import { REGISTER, LOGIN } from "../controller/user.js";

const router = express.Router();

router.post("/register", REGISTER);
router.post("/login", LOGIN);

export default router;
