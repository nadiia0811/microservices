const jwt = require("jsonwebtoken");
const { randomBytes } = require("crypto"); 
import RefreshToken from "../models/refreshToken";
import logger from "./logger";

type Token = {
  accessToken: string;
  refreshToken: string;
}

const generateTokens = async (user: IUser): Promise<Token> => {
  const accessToken = jwt.sign({
    userId: user._id,
    username: user.username
  },
  process.env.JWT_SECRET,
  {expiresIn: "60m"}
  );

  const refreshToken = randomBytes(40).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  try {
    await RefreshToken.create({
      token: refreshToken,
      user: user._id,
      expiresAt
    });

  } catch (err) {
    logger.error("Failed to save refresh token:", err);
    throw new Error("Failed to generate refresh token");
  }
  return {accessToken, refreshToken};
};

export default generateTokens;
