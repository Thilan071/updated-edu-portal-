import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  // If you store a session cookie, clear it here, e.g.:
  // res.cookies.set('session', '', { path: '/', expires: new Date(0) });
  return res;
}
