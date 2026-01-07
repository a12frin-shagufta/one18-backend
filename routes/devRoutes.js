import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

router.get("/admin-token", (req, res) => {
  const token = jwt.sign(
    { role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
});

export default router;
