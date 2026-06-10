import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request) {
  const payload = (await request.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = Array.isArray(payload?.ids) ? payload.ids.filter((id): id is string => typeof id === "string" && id.length > 0) : [];

  if (ids.length === 0) {
    return Response.json({ success: false, error: "Select at least one article to delete." }, { status: 400 });
  }

  const result = await prisma.article.deleteMany({
    where: { id: { in: ids } }
  });

  return Response.json({ success: true, deleted: result.count });
}
