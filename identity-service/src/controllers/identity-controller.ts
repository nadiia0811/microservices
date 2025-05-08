import { Request, Response } from "express";
import generateTokens from "../utils/generateToken";
import logger from "../utils/logger";
import { validateRegistration } from "../utils/validation";
import User from "../models/user";

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
