import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import "dotenv/config";


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
import deliveryRoutes from "./routes/deliveryRoutes.js";
import paymentRoute from "./routes/paymentRoute.js";
import postalRoute from "./routes/postalRoute.js";
import PaynowRoute from "./routes/paynow.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import promoRoutes from "./routes/promoRoutes.js";





const app = express();
app.use(express.json());


/* =====================
   CORS (LOCAL ONLY)
===================== */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
   "http://localhost:5176",
  "https://frontend-pi-seven-84.vercel.app",
  "https://admin-eta-topaz.vercel.app",
  "https://www.one18bakery.com",
  "https://one18bakery.com", // ✅ add non-www also
];

app.use(
  cors({
    origin: (origin, cb) => {
      // ✅ allow Postman/server calls
      if (!origin) return cb(null, true);

      // ✅ allow exact domains
      if (allowedOrigins.includes(origin)) return cb(null, true);

      // ✅ allow any vercel preview domain
      if (origin.endsWith(".vercel.app")) return cb(null, true);

      // ✅ do NOT throw error (prevents CORS headers)
      return cb(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ VERY IMPORTANT
app.options(/.*/, cors());





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
app.use("/api/delivery", deliveryRoutes);
app.use("/api/payment", paymentRoute);
app.use("/api/postal", postalRoute);
app.use("/api/paynow", PaynowRoute);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/promo", promoRoutes);



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
  .then(() => {
    console.log("✅ MongoDB connected");

    /* =====================
       Start Server (IMPORTANT)
    ====================== */
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`🚀 Backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

console.log("☁️ R2 CONFIG:", {
  bucket: process.env.R2_BUCKET_NAME,
  publicUrl: process.env.R2_PUBLIC_URL,
  accountId: process.env.R2_ACCOUNT_ID ? "SET" : "MISSING",
  accessKey: process.env.R2_ACCESS_KEY_ID ? "SET" : "MISSING",
  secretKey: process.env.R2_SECRET_ACCESS_KEY ? "SET" : "MISSING",
});


console.log("ADMIN EMAIL:", process.env.ADMIN_EMAIL);
console.log("HASH EXISTS:", !!process.env.ADMIN_PASSWORD_HASH);


/* =====================
   Server
===================== */



