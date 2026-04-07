import express from "express";

const router = express.Router();

let reports = [];

router.get("/", (req, res) => {
  res.json(reports);
});

router.post("/", (req, res) => {
  reports.push(req.body);
  res.status(201).json({ message: "Report submitted" });
});

export default router;