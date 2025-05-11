import { Request, Response } from "express";
import generateTokens from "../utils/generateToken";
import logger from "../utils/logger";
import { validateRegistration } from "../utils/validation";
import User from "../models/user";
import CustomError from "../utils/customError";
import { validateLogin } from "../utils/validation";
import RefreshToken from "../models/refreshToken";

export const registerUser = async (req: Request, res: Response) => {
  logger.info("User registration...");

  try {
    const { username, email, password } = req.body;
    const { error } = validateRegistration({ username, email, password });

    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });

    if (existingUser) {
      logger.warn("User already exists");
      return res.status(409).json({
        success: false,
        message: "User alredy exists",
      });
    }

    const user = new User({ username, email, password });
    await user.save();
    logger.info("User saved successfully", user._id);

    const { accessToken, refreshToken } = await generateTokens(user);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      accessToken,
      refreshToken,
    });
  } catch (err) {
    logger.error("Registration error occured", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  logger.info("Login user...");
  const { email, password } = req.body;

  try {
    const { error } = validateLogin({ email, password });
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      const isValidPassword = await existingUser.comparePassword(password);
      if (!isValidPassword) {
        logger.warn("Invalid password");
        return res.status(400).json({
          success: false,
          message: "Invalid password",
        });
      }

      const { accessToken, refreshToken } = await generateTokens(existingUser);
      res.json({
        accessToken,
        refreshToken,
        userId: existingUser._id,
      });
    } else {
      logger.warn("Invalid user");
      return res.status(400).json({
        success: false,
        message: "Such a user not found. You need register first",
      });
    }
  } catch (err: unknown) {
    if (err instanceof CustomError) {
      logger.error("Custom login error: ", err);
      return res.status(err.status ?? 500).json({
        success: false,
        message: err.message,
      });
    } else {
      logger.error("Internal server error");
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
};

export const refreshTokenUser = async (req: Request, res: Response) => {
  logger.info("Retrieving refreshToken...");

  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token missing");
      res.status(400).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const storedToken = await RefreshToken.findOne({ token: refreshToken });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn("Invalid or expired token");
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const user = await User.findById(refreshToken.user);

    if (!user) {
      logger.warn("User not found");
      res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateTokens(user);
    
    //delete old resresh token
    await RefreshToken.deleteOne({_id: storedToken._id});
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
    
  } catch (error) {
    logger.warn("Refresh token error occured");
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
