export const ADMIN_COOKIE_NAME =
  process.env.ADMIN_COOKIE_NAME || "topup_admin_session";

export const ADMIN_COOKIE_VALUE =
  process.env.ADMIN_COOKIE_VALUE || "loggedin_topup_admin_2026";

export function isValidAdminLogin(email: string, password: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  return email === adminEmail && password === adminPassword;
}
export function getAdminPublicInfo() {
  return {
    email: process.env.ADMIN_EMAIL || "admin@topupcenter.com",
    role: "Super Admin",
  };
}