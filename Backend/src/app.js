import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { createServer } from "node:http";
import cors from "cors";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);
connectToSocket(server);

app.set("port", process.env.PORT || 3000);
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ extended: true, limit: "40kb" }));
app.use("/api/v1/users", userRoutes);


const start = async () => {
  try {
    const connectionDb = await mongoose.connect(
      "mongodb+srv://rachit24srivastava_db_user:bgZSrEbAXQsEJNEe@vertexa.p8755qf.mongodb.net"
    );
    console.log(`MONGO connected Db Host: ${connectionDb.connection.host}`);

    server.listen(app.get("port"), () => {
      console.log(`Server is running on port ${app.get("port")}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

start();