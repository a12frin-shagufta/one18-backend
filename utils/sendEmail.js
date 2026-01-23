import Brevo from "@getbrevo/brevo";

export const sendEmail = async ({ to, subject, html }) => {
  const apiInstance = new Brevo.TransactionalEmailsApi();

  apiInstance.setApiKey(
    Brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY
  );

  const sendSmtpEmail = new Brevo.SendSmtpEmail();

  sendSmtpEmail.sender = {
    name: process.env.MAIL_FROM_NAME || "ONE18 Bakery",
    email: process.env.MAIL_FROM_EMAIL,
  };

  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = html;

  const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
  return result;
};
