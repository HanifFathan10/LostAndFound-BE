import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const VerifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
      algorithms: ["HS256"],
    });

    return { success: true, data: decoded };
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return { success: false, error: "Token tidak valid" };
    }
    return { success: false, error: "Terjadi kesalahan saat verifikasi token" };
  }
};

export const VerifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, {
    algorithms: ["HS256"],
  });
};

export const CreateAccessToken = (data) => {
  return jwt.sign(data, process.env.ACCESS_TOKEN_SECRET, {
    algorithm: "HS256",
    expiresIn: "1d",
  });
};

export const CreateRefreshToken = (data) => {
  return jwt.sign(data, process.env.REFRESH_TOKEN_SECRET, {
    algorithm: "HS256",
    expiresIn: "7d",
  });
};
