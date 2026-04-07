import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dbconnection from "./lib/dbconnection.js";
import userRoutes from "./Routes/users.route.js";
import reportRoutes from "./Routes/reports.route.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

dbconnection();

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.use("/api/auth", userRoutes);
app.use("/api/reports", reportRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});