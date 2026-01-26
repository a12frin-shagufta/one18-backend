// backend/middleware/multer.js
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(), // ✅ REQUIRED FOR VERCEL
 limits: { fileSize: 10 * 1024 * 1024 }, // 10MB

  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Only image files allowed"));
  },
});

export default upload;
