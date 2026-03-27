import { NextRequest, NextResponse } from "next/server";

import { assertAdminApiAccess } from "@/lib/admin-api-auth";
import {
  AdminCatalogApiError,
  getCatalogs,
  seedCatalogs,
} from "@/lib/admin-catalogs-api";

function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof AdminCatalogApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error("[admin/catalogs] unexpected error", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function GET(request: NextRequest) {
  const denied = assertAdminApiAccess(request);
  if (denied) {
    return denied;
  }

  try {
    try {
      await seedCatalogs();
    } catch (error) {
      console.warn("[admin/catalogs] seed skipped", error);
    }

    const catalogs = await getCatalogs();
    return NextResponse.json({ catalogs }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
