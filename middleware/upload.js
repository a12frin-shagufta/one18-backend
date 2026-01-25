// backend/middleware/multer.js
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(), // ✅ REQUIRED FOR VERCEL
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Only image files allowed"));
  },
});

export default upload;
