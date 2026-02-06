import Newsletter from "../models/newsletterModel.js";
import { sendEmail } from "../utils/sendEmail.js";

export const sendNewsletterToAll = async ({ subject, html }) => {
      console.log("📬 NEWSLETTER TRIGGERED:", subject);
  try {
    const subs = await Newsletter.find({}, "email");
    const emails = subs.map(s => s.email);

    if (!emails.length) return;

    // send in small batches (Brevo safe)
    const batchSize = 50;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);

      await Promise.all(
        batch.map(email =>
          sendEmail({
            to: email,
            subject,
            html
          })
        )
      );
    }

    console.log("Newsletter campaign sent:", emails.length);
  } catch (err) {
    console.error("Newsletter send error:", err);
  }
};
