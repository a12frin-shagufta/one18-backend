import express from "express";
import { bakeryChatbot } from "../controllers/chatbotController.js";

const router = express.Router();

router.post("/chatbot", bakeryChatbot);

export default router;
