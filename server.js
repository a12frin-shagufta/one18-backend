import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

// routes
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/OrderRoute.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import festivalRoutes from "./routes/festivalRoutes.js";
import offerRoutes from "./routes/offerRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import subcategoryRoutes from "./routes/subcategoryRoutes.js";
import branchRoutes from "./routes/branchRoutes.js";
import devRoutes from "./routes/devRoutes.js";



const app = express();
app.use(express.json());


/* =====================
   CORS (LOCAL ONLY)
===================== */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "https://admin-eta-topaz.vercel.app",
      "https://frontend-pi-seven-84.vercel.app"
    ],
   methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

/* =====================
   Middleware
===================== */




/* =====================
   Routes
===================== */
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminAuthRoutes);
app.use("/api/festivals", festivalRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/categories", categoryRoutes);

app.use("/api/subcategories", subcategoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/dev", devRoutes);

/* =====================
   Health Check
===================== */
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

/* =====================
   MongoDB
===================== */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) =>
    console.error("❌ MongoDB connection error:", err.message)
  );

  console.log("☁️ CLOUDINARY:", {
  name: process.env.CLOUDINARY_CLOUD_NAME,
  key: process.env.CLOUDINARY_API_KEY,
  secret: process.env.CLOUDINARY_API_SECRET ? "SET" : "MISSING",
});

console.log("ADMIN EMAIL:", process.env.ADMIN_EMAIL);
console.log("HASH EXISTS:", !!process.env.ADMIN_PASSWORD_HASH);


/* =====================
   Server
===================== */
// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`🚀 Backend running on http://localhost:${PORT}`);
// });

// for vercel
export default app;
