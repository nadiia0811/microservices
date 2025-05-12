import express from "express";
 import {
  registerUser,
  loginUser,
  logoutUser,
  refreshTokenUser
} from "../controllers/identity-controller"; 
 

const router = express.Router();
//@ts-ignore
router.post("/register", registerUser);
//@ts-ignore
router.post("/login", loginUser);
//@ts-ignore
router.post("/logout", logoutUser);
//@ts-ignore
router.post("/refresh-token", refreshTokenUser);

export default router;
