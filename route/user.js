import express from "express";
import { REGISTER, LOGIN, LOGOUT } from "../controller/user.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/register", REGISTER);
router.post("/login", LOGIN);
router.post("/logout", [auth], LOGOUT);

export default router;
