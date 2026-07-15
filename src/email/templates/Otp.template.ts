export const OtpTemplate = (otp: string, name: string): string => {
  return `
    <p>Hi ${name},</p>
    <p>Your OTP is: <strong>${otp}</strong></p>
    <p>Please use this code to complete your verification. This code will expire in 10 minutes.</p>
  `;
};

export const resetPasswordTemplate = (
  resetLink: string,
  name: string,
): string => {
  return `
    <p>Hi ${name},</p>
    <p>You requested to reset your password. Please click the link below to reset it:</p>
    <a href="${resetLink}">Reset Password</a>
    <p>If you did not request a password reset, please ignore this email.</p>
  `;
};
