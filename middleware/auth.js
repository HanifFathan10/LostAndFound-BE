import { VerifyAccessToken } from "../utils/jwt.js";

const auth = (req, res, next) => {
  const accessToken = req.headers.authorization?.replace(/^Bearer\s/, "");

  const token = VerifyAccessToken(accessToken);
  if (token.success) {
    req.user = token.data.id;
    return next();
  } else {
    return res.status(403).json({
      status: false,
      statusCode: 403,
      message: "Forbidden",
    });
  }
};

export default auth;
