export const OtpTemplate = (otp: string, name: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OTP Verification</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f9fafb;
      margin: 0;
      padding: 40px 20px;
      color: #111827;
    }
    .container {
      max-width: 520px;
      margin: 0 auto;
      background: #ffffff;
      padding: 48px 40px;
      border-radius: 8px;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      color: #f97316;
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 500;
      margin: 24px 0 4px 0;
    }
    .text {
      font-size: 15px;
      line-height: 1.7;
      color: #4b5563;
      margin: 0 0 12px 0;
    }
    .otp {
      font-size: 32px;
      font-weight: 700;
      color: #f97316;
      letter-spacing: 6px;
      margin: 20px 0;
      padding: 12px 0;
      border-top: 2px solid #f3f4f6;
      border-bottom: 2px solid #f3f4f6;
      display: inline-block;
    }
    .note {
      font-size: 14px;
      color: #6b7280;
      margin: 16px 0 0 0;
    }
    .divider {
      height: 1px;
      background: #f3f4f6;
      margin: 32px 0 24px 0;
    }
    .footer {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
    }
    .footer a {
      color: #f97316;
      text-decoration: none;
    }
    @media (max-width: 480px) {
      .container { padding: 32px 24px; }
      .otp { font-size: 26px; letter-spacing: 4px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <p class="logo">Servo</p>
    <p class="greeting">Hi ${name},</p>
    <p class="text">
      We received a request to verify your email address for your Servo account.
    </p>
    <p class="text">
      Your verification code is:
    </p>
    <div class="otp">${otp}</div>
    <p class="note">This code will expire in 10 minutes.</p>
    <p class="note" style="margin-top: 8px;">
      If you didn't request this, please ignore this email.
    </p>
    <div class="divider"></div>
    <p class="footer">
      Need help? Contact us at <a href="mailto:support@servo.sbs">support@servo.sbs</a>
    </p>
    <p class="footer" style="margin-top: 4px;">
      &copy; ${new Date().getFullYear()} Servo. All rights reserved.
    </p>
  </div>
</body>
</html>
  `;
};

export const resetPasswordTemplate = (
  resetLink: string,
  name: string,
): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f9fafb;
      margin: 0;
      padding: 40px 20px;
      color: #111827;
    }
    .container {
      max-width: 520px;
      margin: 0 auto;
      background: #ffffff;
      padding: 48px 40px;
      border-radius: 8px;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      color: #f97316;
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 500;
      margin: 24px 0 4px 0;
    }
    .text {
      font-size: 15px;
      line-height: 1.7;
      color: #4b5563;
      margin: 0 0 12px 0;
    }
    .button {
      display: inline-block;
      background: #f97316;
      color: #ffffff;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      padding: 12px 32px;
      border-radius: 6px;
      margin: 16px 0;
    }
    .button:hover {
      background: #ea580c;
    }
    .link {
      font-size: 14px;
      color: #6b7280;
      margin: 8px 0 0 0;
      word-break: break-all;
    }
    .link a {
      color: #f97316;
      text-decoration: none;
    }
    .note {
      font-size: 14px;
      color: #6b7280;
      margin: 16px 0 0 0;
    }
    .divider {
      height: 1px;
      background: #f3f4f6;
      margin: 32px 0 24px 0;
    }
    .footer {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
    }
    .footer a {
      color: #f97316;
      text-decoration: none;
    }
    @media (max-width: 480px) {
      .container { padding: 32px 24px; }
      .button { display: block; text-align: center; }
    }
  </style>
</head>
<body>
  <div class="container">
    <p class="logo">Servo</p>
    <p class="greeting">Hi ${name},</p>
    <p class="text">
      We received a request to reset the password for your Servo account.
    </p>
    <p class="text">
      Click the button below to create a new password:
    </p>
    <div>
      <a href="${resetLink}" class="button">Reset Password</a>
    </div>
    <p class="link">
      Or copy and paste this link into your browser:<br>
      <a href="${resetLink}">${resetLink}</a>
    </p>
    <p class="note">
      This link will expire in 24 hours.
    </p>
    <p class="note" style="margin-top: 4px;">
      If you didn't request this, please ignore this email.
    </p>
    <div class="divider"></div>
    <p class="footer">
      For security, never share this link with anyone.
    </p>
    <p class="footer" style="margin-top: 4px;">
      &copy; ${new Date().getFullYear()} Servo. All rights reserved.
    </p>
  </div>
</body>
</html>
  `;
};

export const defaultLoginCredentialsTemplate = (
  email: string,
  password: string,
  name?: string,
): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Servo Account Credentials</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f9fafb;
      margin: 0;
      padding: 40px 20px;
      color: #111827;
    }
    .container {
      max-width: 520px;
      margin: 0 auto;
      background: #ffffff;
      padding: 48px 40px;
      border-radius: 8px;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      color: #f97316;
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 500;
      margin: 24px 0 4px 0;
    }
    .text {
      font-size: 15px;
      line-height: 1.7;
      color: #4b5563;
      margin: 0 0 12px 0;
    }
    .credentials-box {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 20px 24px;
      margin: 16px 0;
    }
    .credential-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
    }
    .credential-label {
      color: #6b7280;
      font-weight: 500;
    }
    .credential-value {
      color: #111827;
      font-weight: 600;
      font-family: 'Courier New', monospace;
      word-break: break-all;
    }
    .note {
      font-size: 14px;
      color: #6b7280;
      margin: 16px 0 0 0;
    }
    .warning {
      font-size: 14px;
      color: #dc2626;
      margin: 12px 0 0 0;
      padding: 12px 16px;
      background: #fef2f2;
      border-radius: 6px;
      border-left: 3px solid #dc2626;
    }
    .divider {
      height: 1px;
      background: #f3f4f6;
      margin: 32px 0 24px 0;
    }
    .footer {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
    }
    .footer a {
      color: #f97316;
      text-decoration: none;
    }
    .action-button {
      display: inline-block;
      background: #f97316;
      color: #ffffff;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      padding: 12px 32px;
      border-radius: 6px;
      margin: 8px 0 0 0;
    }
    .action-button:hover {
      background: #ea580c;
    }
    @media (max-width: 480px) {
      .container { padding: 32px 24px; }
      .credentials-box { padding: 16px; }
      .credential-row { flex-direction: column; gap: 2px; }
      .action-button { display: block; text-align: center; }
    }
  </style>
</head>
<body>
  <div class="container">
    <p class="logo">Servo</p>
    <p class="greeting">${name ? `Hi ${name},` : "Hi there,"}</p>
    <p class="text">
      Your Servo account has been created successfully. Below are your login credentials.
    </p>
    <div class="credentials-box">
      <div class="credential-row">
        <span class="credential-label">Email</span>
        <span class="credential-value">${email}</span>
      </div>
      <div class="credential-row">
        <span class="credential-label">Password</span>
        <span class="credential-value">${password}</span>
      </div>
    </div>
    <p class="text">
      Click the button below to log in to your account:
    </p>
    <div>
      <a href="https://app.servo.sbs/auth/login" class="action-button">Log In to Servo</a>
    </div>
    <p class="note">
      We strongly recommend changing your password after your first login.
    </p>
    <div class="warning">
      ⚠️ This email contains sensitive login information. Please keep it secure and do not share it with anyone.
    </div>
    <div class="divider"></div>
    <p class="footer">
      Need help? Contact us at <a href="mailto:support@servo.sbs">support@servo.sbs</a>
    </p>
    <p class="footer" style="margin-top: 4px;">
      &copy; ${new Date().getFullYear()} Servo. All rights reserved.
    </p>
  </div>
</body>
</html>
  `;
};
