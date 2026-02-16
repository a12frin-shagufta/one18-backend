import express from "express";
import { bakeryChatbot } from "../controllers/chatbotController.js";

const router = express.Router();

router.post("/", bakeryChatbot);

export default router;
