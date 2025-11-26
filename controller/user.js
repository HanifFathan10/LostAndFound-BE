import { createUser, getUserByEmail, loginUser } from "../model/user.js";
import { CreateAccessToken } from "../utils/jwt.js";

export const REGISTER = async (req, res) => {
  try {
    const data = req.body;

    const existingUser = await getUserByEmail(data.email);

    if (existingUser) {
      return res.status(400).json({ message: "Email sudah terdaftar!!" });
    }

    const newUserId = await createUser(data);

    res.status(201).json({
      message: "User registered successfully",
      userId: newUserId,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal mendaftar user", error: error.message });
  }
};

export const LOGIN = async (req, res) => {
  try {
    const data = req.body;

    const user = await loginUser(data);

    const payload = {
      id: user.user_id,
      role: user.role,
    };

    const token = CreateAccessToken(payload);

    if (user) {
      return res.status(200).json({ message: "Login successful", user, token });
    } else {
      return res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Gagal login user", error: error.message });
  }
};
