import { NextRequest, NextResponse } from "next/server";

import { assertAdminApiAccess } from "@/lib/admin-api-auth";
import { AdminCatalogApiError, setCatalogCover } from "@/lib/admin-catalogs-api";
import { setCoverSchema } from "@/lib/admin-catalogs-validations";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof AdminCatalogApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error("[admin/catalogs/:slug/cover] unexpected error", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const denied = assertAdminApiAccess(request);
  if (denied) {
    return denied;
  }

  const { slug } = await context.params;

  try {
    const body = await request.json();
    const parsed = setCoverSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const catalog = await setCatalogCover(slug, parsed.data);
    return NextResponse.json({ catalog }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
