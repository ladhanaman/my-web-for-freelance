import { NextRequest, NextResponse } from "next/server";

import { assertAdminApiAccess } from "@/lib/admin-api-auth";
import { AdminCatalogApiError, deleteCatalogPhoto } from "@/lib/admin-catalogs-api";

interface RouteContext {
  params: Promise<{ slug: string; photoId: string }>;
}

function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof AdminCatalogApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error("[admin/catalogs/:slug/photos/:photoId] unexpected error", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const denied = assertAdminApiAccess(request);
  if (denied) {
    return denied;
  }

  const { slug, photoId } = await context.params;

  try {
    const catalog = await deleteCatalogPhoto(slug, photoId);
    return NextResponse.json({ catalog }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
