// app/api/download-video/route.ts
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const videoUrl = req.nextUrl.searchParams.get("url");

  if (!videoUrl) {
    return new Response("Missing video URL", { status: 400 });
  }

  const res = await fetch(videoUrl);

  if (!res.ok) {
    return new Response("Failed to fetch video", { status: 500 });
  }

  const contentType = res.headers.get("content-type") || "video/mp4";
  const buffer = await res.arrayBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="download.mp4"`,
    },
  });
}
