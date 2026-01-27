import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendmail = async (to, subject, text) => {
  const mailOptions = {
    from: process.env.MAIL_USER,
    to,
    subject,
    text,
  };

  await transporter.sendMail(mailOptions);
};

export default sendmail;