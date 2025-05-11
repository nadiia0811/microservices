import express from "express";
import { registerUser, loginUser } from "../controllers/identity-controller";

const router = express.Router();
//@ts-ignore
router.post("/register", registerUser);
//@ts-ignore
router.post("/login", loginUser);

export default router;
