import httpStatus from "http-status";
import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../models/user.models.js";
import { Meeting } from "../models/meeting.model.js";

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Please Provide" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({ message: "User Not Found" });
    }

    let isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (isPasswordCorrect) {
      let token = crypto.randomBytes(20).toString("hex");

      user.token = token;
      await user.save();
      return res.status(httpStatus.OK).json({ token: token });
    } else {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Username or password" });
    }
  } catch (e) {
    return res.status(500).json({ message: `Something went wrong ${e}` });
  }
};

const register = async (req, res) => {
  const { name, username, email, password } = req.body;
  if (!name || !username || !email || !password) {
  return res.status(400).json({ message: "Please provide all fields" });
}

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(httpStatus.FOUND).json({ message: "Username already exists" });
    }
     const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    return res.status(httpStatus.FOUND).json({ message: "Email already exists" });
  }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    return res.status(httpStatus.CREATED).json({ message: "User registered successfully" });
  } catch (error) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Error registering user" });
  }
};

const getUserHistory = async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({ token: token });
    const meetings = await Meeting.find({ user_id: user.username });

    res.json(meetings);
  } catch (error) {
    res.json({ message: `Something went wrong ${error}` });
  }
}

const addToHistory = async (req, res) => {
  const { token, meeting_code } = req.body;

  try {
    const user = await User.findOne({ token: token });

    const newMeeting = new Meeting({
      user_id: user.username,
      meetingId: meeting_code,
    });

    await newMeeting.save();

    res.status(httpStatus.CREATED).json({ message: "Meeting added to history" });
  } catch (error) {
    res.json({ message: `Something went wrong ${error}` });
  }
}


export { login, register, getUserHistory, addToHistory};