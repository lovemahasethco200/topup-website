
import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE_NAME =
  process.env.ADMIN_COOKIE_NAME || "topup_admin_session";

export const ADMIN_SESSION_DURATION = 7 * 24 * 60 * 60;

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET must be configured with at least 32 characters."
    );
  }

  return secret;
}

export function isValidAdminLogin(
  email: string,
  password: string
): boolean {
  const configuredEmail = process.env.ADMIN_EMAIL;
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredEmail || !configuredPassword) {
    return false;
  }

  return (
    email.trim().toLowerCase() === configuredEmail.trim().toLowerCase() &&
    password === configuredPassword
  );
}

function sign(payload: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

export function createAdminSession(): {
  token: string;
  maxAge: number;
} {
  const expiresAt =
    Math.floor(Date.now() / 1000) + ADMIN_SESSION_DURATION;

  const payload = `v1.${expiresAt}`;
  const token = `${payload}.${sign(payload)}`;

  return {
    token,
    maxAge: ADMIN_SESSION_DURATION,
  };
}

export function verifyAdminSession(
  token: string | undefined
): boolean {
  if (!token) return false;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const [version, expiryText, signature] = parts;

    if (version !== "v1" || !/^\d+$/.test(expiryText)) {
      return false;
    }

    const expiresAt = Number(expiryText);

    if (
      !Number.isSafeInteger(expiresAt) ||
      expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return false;
    }

    const payload = `${version}.${expiryText}`;
    const expected = Buffer.from(sign(payload), "base64url");
    const received = Buffer.from(signature, "base64url");

    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function getAdminPublicInfo() {
  return {
    email: process.env.ADMIN_EMAIL || "",
    role: "Super Admin",
  };
}