// TEMPORARY LOOPBACK QA SINK. Removed before production build.
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { curatedTemplates } from "@/lib/templates/curated-catalog";
import { templates } from "@/lib/templates/catalog";
export async function POST(request) {
  if (process.env.NODE_ENV !== "development")
    return new Response("Unavailable", { status: 404 });
  const data = await request.json();
  if (data.report && Array.isArray(data.report.rows) && data.report.rows.length <= 132) {
    await writeFile(join(process.cwd(), "docs/template-review", data.report.legacy ? "legacy-acceptance.json" : "browser-acceptance.json"), JSON.stringify(data.report, null, 2));
    return Response.json({ ok: true });
  }
  const legacy = templates.some(t => t.id === data.id);
  if (
    !(legacy || curatedTemplates.some((t) => t.id === data.id)) ||
    !["png", "jpeg"].includes(data.format) ||
    typeof data.data !== "string" ||
    data.data.length > 8 * 1024 * 1024
  )
    return new Response("Invalid", { status: 400 });
  const raw = Buffer.from(data.data, "base64");
  const image = sharp(raw);
  const meta = await image.metadata();
  if (meta.width > 4096 || meta.height > 4096)
    return new Response("Invalid", { status: 400 });
  const root = join(process.cwd(), "docs", "template-review", "exports");
  await mkdir(root, { recursive: true });
  await writeFile(
    join(root, `${data.id}.${data.format === "jpeg" ? "jpg" : "png"}`),
    raw,
  );
  if (data.format === "png") {
    const thumb = legacy ? join(process.cwd(), "docs/template-review/legacy") : join(process.cwd(), "public", "images", "templates");
    await mkdir(thumb, { recursive: true });
    await image
      .resize({ width: 480 })
      .webp({ quality: 82 })
      .toFile(join(thumb, `${data.id}.webp`));
  }
  return Response.json({ ok: true, width: meta.width, height: meta.height });
}
