import { NextResponse } from "next/server";
import { z } from "zod";
import { searchAdminEntities } from "@/lib/data/search";
import { requireApiRole, isApiAuthError } from "@/lib/auth/require-role";
import { handleApiError, generateRequestId } from "@/lib/api/handle-error";

const searchSchema = z.object({
  q: z.string().trim().min(2, "Query must be at least 2 characters").max(100),
  type: z.enum(["users", "teams", "projects"]),
});

export async function GET(request: Request) {
  const requestId = generateRequestId();
  try {
    const auth = await requireApiRole(["admin"]);
    if (isApiAuthError(auth)) return auth.error;

    const { searchParams } = new URL(request.url);
    const parsed = searchSchema.safeParse({
      q: searchParams.get("q") ?? "",
      type: searchParams.get("type") ?? "users",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid search" },
        { status: 400 }
      );
    }

    const results = await searchAdminEntities(parsed.data.type, parsed.data.q);

    return NextResponse.json({ results });
  } catch (error) {
    return handleApiError(error, { route: "GET /api/admin/search", requestId });
  }
}
