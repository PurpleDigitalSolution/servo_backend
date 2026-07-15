import crypto from "crypto";

/**
 * Generates a cryptographically secure, collision-resistant transaction reference.
 * Example structure: TXN_ORD_1718109873111-a8f3b2
 * @returns {string} Highly unique alphanumeric transaction reference
 */
export const generateTransactionReference = (): string => {
  const timestamp = Date.now().toString();
  const prefix = "TXN_ORD_";
  const secureSuffix = crypto.randomBytes(3).toString("hex");
  return `${prefix}${timestamp}-${secureSuffix}`;
};

/**
 * Generates a cryptographically secure numeric OTP of variable length.
 * @param {number} [length=6] - Requested digit depth for the code
 * @throws {Error} If requested length is less than 1
 * @returns {string} Secure numeric access code
 */
export const generateOTP = (length: number = 6): string => {
  if (length < 1) {
    throw new Error("OTP length must be at least 1");
  }

  // Calculate high-low integer boundaries dynamically based on length parameter
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  // const range = max - min + 1;

  const secureRandomInt = crypto.randomInt(min, max + 1);

  return secureRandomInt.toString();
};
/**
 * Generates a cryptographically secure random hexadecimal token of the exact specified length.
 * @param {number} [length=32] - The exact character length of the returned hex string.
 * @throws {Error} If the requested length is less than 1.
 * @returns {string} Hexadecimal string of the requested length.
 */
export const generateRandomToken = (length: number = 32): string => {
  if (length < 1) {
    throw new Error("Token length must be at least 1");
  }

  // Derive the required number of bytes needed to produce the target hex character count.
  // Each byte converts to exactly 2 hex characters.
  const byteLength = Math.ceil(length / 2);
  const hexString = crypto.randomBytes(byteLength).toString("hex");

  // Slice the string to ensure the exact length is returned, accommodating odd length requests.
  return hexString.slice(0, length);
};
