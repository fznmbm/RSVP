import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // TEMPORARY: Hardcoded hash for testing
    // This is the hash for: AHHC2026@admin
    const adminPasswordHash =
      "$2a$10$pnvKoOGo2ERxZugL1CUrFuF9hVYBh0JXB5lT3JgXs.KDluQA7hLk2";

    // Compare password with hash
    const isValid = await bcrypt.compare(password, adminPasswordHash);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Generate a simple token
    const token = Buffer.from(`admin:${Date.now()}`).toString("base64");

    return NextResponse.json({
      success: true,
      token,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
