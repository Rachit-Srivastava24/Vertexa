import dotenv from "dotenv";
dotenv.config();

import Brevo from "@getbrevo/brevo";
import crypto from "crypto";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import User from "../models/user.models.js";

let otpStore = {};

const brevo = new Brevo.TransactionalEmailsApi();

brevo.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

const sendOtp = async (req, res) => {
  const { name, username, email, password } = req.body;

  if (!name || !username || !email || !password) {
    return res.status(400).json({
      message: "Please provide all fields",
    });
  }

  try {
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(httpStatus.FOUND).json({
        message: "Username already exists",
      });
    }

    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      return res.status(httpStatus.FOUND).json({
        message: "Email already exists",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore[email] = {
      otp,
      name,
      username,
      email,
      password,
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    const sendSmtpEmail = new Brevo.SendSmtpEmail();

    sendSmtpEmail.subject = "Your Vertexa Registration OTP";
    sendSmtpEmail.textContent = `Your OTP is ${otp}. It is valid for 5 minutes.`;
    sendSmtpEmail.sender = {
      name: "Vertexa",
      email: process.env.EMAIL_USER,
    };
    sendSmtpEmail.to = [
      {
        email: email,
      },
    ];

    await brevo.sendTransacEmail(sendSmtpEmail);

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

  try {
    const hashedPassword = await bcrypt.hash(record.password, 10);

    const newUser = new User({
      name: record.name,
      username: record.username,
      email: record.email,
      password: hashedPassword,
    });

    await newUser.save();

    delete otpStore[email];

    const token = crypto.randomBytes(20).toString("hex");

    newUser.token = token;

    await newUser.save();

    return res.status(httpStatus.OK).json({
      message: "Registration successful",
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Error registering user",
    });
  }
};

export { sendOtp, verifyOtp };