import { Router } from "express";
import { addToHistory, getUserHistory, login, register } from "../controllers/user.controller.js";
import { sendOtp, verifyOtp } from "../controllers/otp.controller.js";

const router = Router();

router.route("/login").post(login)
router.route("/register").post(register)
router.route("/add_to_activity").post(addToHistory)
router.route("/get_all_activity").get(getUserHistory)
router.route("/send-otp").post(sendOtp)
router.route("/verify-otp").post(verifyOtp)

export default router;