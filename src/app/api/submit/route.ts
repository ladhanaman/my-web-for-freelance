import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { leadSchema } from "@/lib/validations";

const DB_TIMEOUT_MS = 8000;

export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    console.warn("[submit] DATABASE_URL not set — skipping DB write");
    return NextResponse.json({ success: true }, { status: 201 });
  }

  try {
    const body = await request.json();
    const validated = leadSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { websiteUrl, ...rest } = validated.data;

    const lead = await Promise.race([
      prisma.lead.create({
        data: { ...rest, websiteUrl: websiteUrl || null },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("DB timeout")), DB_TIMEOUT_MS)
      ),
    ]);

    return NextResponse.json({ success: true, id: lead.id }, { status: 201 });
  } catch (error) {
    console.error("[submit] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
