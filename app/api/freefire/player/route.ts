
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get("uid")?.trim();
  const region = request.nextUrl.searchParams.get("region")?.trim().toUpperCase();

  const allowedRegions = [
    "BD", "SG", "IND", "ME", "BR",
    "US", "VN", "TH", "CIS", "ID", "PK"
  ];

  if (!uid || !/^\d{5,20}$/.test(uid)) {
    return NextResponse.json(
      { error: "Please enter a valid Free Fire UID." },
      { status: 400 }
    );
  }

  if (!region || !allowedRegions.includes(region)) {
    return NextResponse.json(
      { error: "Please select a supported region." },
      { status: 400 }
    );
  }

  const apiKey = process.env.FREEFIRE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Free Fire API is not configured." },
      { status: 500 }
    );
  }

  try {
    const apiUrl = new URL(
      "https://siambhau69.eu.cc/freefireinfo/bhau"
    );

    apiUrl.searchParams.set("uid", uid);
    apiUrl.searchParams.set("region", region);
    apiUrl.searchParams.set("key", apiKey);

    const response = await fetch(apiUrl.toString(), {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to verify this UID. Please try again." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const player = data?.basicInfo;

    if (!player?.nickname || String(player.accountId) !== uid) {
      return NextResponse.json(
        { error: "Player not found. Check the UID and region." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      uid: String(player.accountId),
      nickname: String(player.nickname),
      region: String(player.region ?? region),
    });
  } catch {
    return NextResponse.json(
      { error: "Free Fire service is temporarily unavailable." },
      { status: 502 }
    );
  }
}
