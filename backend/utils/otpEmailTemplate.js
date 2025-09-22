// A modern, branded HTML template for OTP emails
// Usage: require and use getOtpEmailTemplate(otp, expiresInMinutes)

function getOtpEmailTemplate(otp, expiresInMinutes = 10, client = {}) {
  return `
    <div style="font-family: Arial, sans-serif; background: #e6f4ea; padding: 40px 0;">
      <div style="max-width: 480px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); padding: 32px 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src='https://cdn-icons-png.flaticon.com/512/561/561127.png' alt='OTP' width='56' style='margin-bottom: 8px;' />
          <h2 style="color: #227a3a; margin: 0 0 8px;">Your One-Time Password (OTP)</h2>
        </div>
        <div style="margin-bottom: 20px;">
          <table style="width:100%; font-size:15px; color:#2e5937; background:#e6f4ea; border-radius:6px; margin-bottom:16px;">
            <tr><td style="padding:6px 0;"><b>Name:</b></td><td style="padding:6px 0;">${
              client.name || "-"
            }</td></tr>
            <tr><td style="padding:6px 0;"><b>Email:</b></td><td style="padding:6px 0;">${
              client.email || "-"
            }</td></tr>
            <tr><td style="padding:6px 0;"><b>Company:</b></td><td style="padding:6px 0;">${
              client.company || "-"
            }</td></tr>
          </table>
        </div>
        <p style="font-size: 16px; color: #2e5937; margin-bottom: 24px; text-align: center;">
          Use the following OTP to complete your password reset. This code is valid for <b>${expiresInMinutes} minutes</b>.
        </p>
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="display: inline-block; font-size: 32px; letter-spacing: 8px; color: #fff; font-weight: bold; background: #34c759; padding: 12px 32px; border-radius: 8px;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 14px; color: #4e6e5d; text-align: center;">
          If you did not request this, you can safely ignore this email.
        </p>
        <hr style="margin: 32px 0 16px; border: none; border-top: 1px solid #b7e4c7;" />
        <div style="font-size: 12px; color: #6c8f7d; text-align: center;">
          &copy; ${new Date().getFullYear()} Issue Tracker. All rights reserved.
        </div>
      </div>
    </div>
  `;
}

module.exports = { getOtpEmailTemplate };
