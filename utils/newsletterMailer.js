import Newsletter from "../models/newsletterModel.js";
import { sendEmail } from "./sendEmail.js";

console.log("🔥 NEWSLETTER MAILER VERSION FINAL");

export const sendNewsletterToAll = async ({ subject, html }) => {
  try {
    console.log("📬 NEWSLETTER TRIGGERED:", subject);

    const subs = await Newsletter.find({}, "email");

    for (const s of subs) {
      console.log("➡️ sending to:", s.email);

      try {
        await sendEmail({
          to: s.email,
          subject,
          html
        });
      } catch (err) {
        console.error("❌ failed:", s.email, err.message);
      }
    }

    console.log("✅ Newsletter finished:", subs.length);

  } catch (err) {
    console.error("❌ newsletter fatal:", err);
  }
};
