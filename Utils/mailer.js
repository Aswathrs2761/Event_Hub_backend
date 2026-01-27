// utils/mailer.js
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendmail = async (to, subject, text) => {
  const msg = {
    to,
    from: process.env.MAIL_FROM, // must match your verified sender in SendGrid
    subject,
    text,
  };

  await sgMail.send(msg);
};

export default sendmail;