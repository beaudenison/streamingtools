import { NextResponse } from "next/server";

export const revalidate = 60;

const SLUG = /^[a-zA-Z0-9_-]{1,30}$/;

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug")?.trim() ?? "";
  if (!SLUG.test(slug)) {
    return NextResponse.json({ error: "invalid slug" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://kick.com/api/v2/channels/${slug}`, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "not found" }, { status: res.status });
    }

    const data = (await res.json()) as {
      user_id?: number;
      user?: { id?: number; username?: string };
      chatroom?: { id?: number };
      slug?: string;
    };

    const chatroomId = data.chatroom?.id;
    if (!chatroomId) {
      return NextResponse.json({ error: "no chatroom" }, { status: 502 });
    }

    return NextResponse.json({
      slug: data.slug ?? slug.toLowerCase(),
      chatroomId,
      userId: data.user_id ?? data.user?.id ?? null,
      username: data.user?.username ?? slug,
    });
  } catch {
    return NextResponse.json({ error: "kick lookup failed" }, { status: 502 });
  }
}
