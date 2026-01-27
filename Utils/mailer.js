// Utils/mailer.js
import fetch from "node-fetch";

const sendmail = async (to, subject, text) => {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { email: process.env.MAIL_FROM },
      to: [{ email: to }],
      subject,
      textContent: text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
};

export default sendmail;