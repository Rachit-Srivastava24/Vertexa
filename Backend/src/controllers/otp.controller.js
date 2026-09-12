import dotenv from "dotenv";
dotenv.config();

import { Resend } from "resend";
import crypto from "crypto";
import httpStatus from "http-status";
import User from "../models/user.models.js";

let otpStore = {};

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore[email] = {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    const { data, error } = await resend.emails.send({
      from: "Vertexa <onboarding@resend.dev>",
      to: [email],
      subject: "Your Vertexa OTP",
      text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    });

    if (error) {
      console.error("Resend error:", error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Failed to send OTP",
      });
    }

    return res.status(httpStatus.OK).json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("OTP error:", error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Failed to send OTP",
    });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      message: "Email and OTP are required",
    });
  }

  const record = otpStore[email];

  if (!record) {
    return res.status(400).json({
      message: "No OTP requested for this email",
    });
  }

  if (Date.now() > record.expiresAt) {
    delete otpStore[email];

    return res.status(400).json({
      message: "OTP expired, please request a new one",
    });
  }

  if (record.otp !== otp) {
    return res.status(400).json({
      message: "Invalid OTP",
    });
  }

  delete otpStore[email];

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "No account found with this email. Please register first.",
      });
    }

    const token = crypto.randomBytes(20).toString("hex");

    user.token = token;

    await user.save();

    return res.status(httpStatus.OK).json({ token });
  } catch (error) {
    console.error(error);

    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Something went wrong",
    });
  }
};

export { sendOtp, verifyOtp };