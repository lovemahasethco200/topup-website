import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  return NextResponse.json({
    success: true,
    admin: true,
  });
}