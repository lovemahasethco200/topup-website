
import { createHmac, timingSafeEqual } from "node:crypto";

export const CUSTOMER_COOKIE_NAME = "topup_customer_session";
const SESSION_DURATION = 7 * 24 * 60 * 60;

function getSecret(): string {
  const secret = process.env.CUSTOMER_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "CUSTOMER_SESSION_SECRET must be at least 32 characters."
    );
  }

  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret())
    .update(value)
    .digest("base64url");
}

export function createCustomerSession(userId: string): {
  token: string;
  maxAge: number;
} {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION;
  const payload = `${userId}.${expiresAt}`;
  const token = `${payload}.${sign(payload)}`;

  return { token, maxAge: SESSION_DURATION };
}

export function verifyCustomerSession(
  token: string | undefined
): { userId: string } | null {
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [userId, expiryText, signature] = parts;
    const payload = `${userId}.${expiryText}`;
    const expectedSignature = sign(payload);

    const received = Buffer.from(signature, "base64url");
    const expected = Buffer.from(expectedSignature, "base64url");

    if (
      received.length !== expected.length ||
      !timingSafeEqual(received, expected)
    ) {
      return null;
    }

    if (!/^[a-f\d]{24}$/i.test(userId)) return null;

    const expiresAt = Number(expiryText);

    if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return { userId };
  } catch {
    return null;
  }
}
