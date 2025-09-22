// Example usage of the email service
const { sendEmail } = require("./emailService");

// Send a test email
sendEmail({
  to: "recipient@example.com",
  subject: "Test Email",
  text: "This is a test email from the Issue Tracker backend.",
  html: "<b>This is a test email from the Issue Tracker backend.</b>",
})
  .then((info) => console.log("Email sent:", info.response))
  .catch((err) => console.error("Error sending email:", err));
