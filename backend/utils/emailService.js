const nodemailer = require("nodemailer");
const emailConfig = require("../config/email");

const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  auth: emailConfig.auth,
});

async function sendEmail({ to, subject, text, html }) {
  const mailOptions = {
    from: emailConfig.auth.user,
    to,
    subject,
    text,
    html,
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendEmail };
