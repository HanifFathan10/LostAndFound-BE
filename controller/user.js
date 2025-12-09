import {
  createUser,
  getUserByEmail,
  getUserByNpm,
  loginUser,
  logoutUser,
} from "../model/user.js";
import { CreateAccessToken } from "../utils/jwt.js";

export const REGISTER = async (req, res) => {
  try {
    const data = req.body;

    const userByEmail = await getUserByEmail(data.email);
    if (userByEmail) {
      return res
        .status(400)
        .json({ status: 400, message: "Email sudah digunakan!" });
    }

    const userByNpm = await getUserByNpm(data.npm);
    if (userByNpm) {
      return res.status(400).json({
        status: 400,
        message: "NPM sudah digunakan, tidak boleh duplikat!",
      });
    }

    const newUserId = await createUser(data);

    return res.status(201).json({
      status: "success",
      message: "User registered successfully",
      userId: newUserId,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Gagal mendaftar user",
      error: error.message,
    });
  }
};

export const LOGIN = async (req, res) => {
  try {
    const data = req.body;

    const user = await loginUser(data);

    if (!user) {
      return res.status(400).json({
        status: 400,
        message: "user dengan email ini tidak ditemukan!",
      });
    }

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
    return res.status(500).json({
      status: "error",
      message: "Gagal login user",
      error: error.message,
    });
  }
};

export const LOGOUT = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.sendStatus(204);
    }

    await logoutUser(user);

    return res
      .status(200)
      .json({ status: "success", message: "Berhasil logout" });
  } catch (error) {
    return res.status(500).json({
      message: "Gagal logout",
      error: error.message,
    });
  }
};
