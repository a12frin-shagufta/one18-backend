// controllers/paymentProofController.js
import { uploadPaymentProofToR2 } from "../utils/uploadPaymentProofToR2.js";

export const uploadPaymentProof = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No payment screenshot uploaded" });
    }

    const url = await uploadPaymentProofToR2(req.file);

    res.json({ success: true, url });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

