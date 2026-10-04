import "server-only";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "../../../../db/client";
import { getDifficultNumbers, setDifficultWord } from "../../../../db/difficult-repository";
import { isLearnerId, readDifficultPayload } from "@/lib/difficult";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const COOKIE_NAME = "eitango_learner";
const headers = { "Cache-Control": "private, no-store" };

function learnerFor(request: NextRequest) {
  const value = request.cookies.get(COOKIE_NAME)?.value;
  return isLearnerId(value) ? value : randomUUID();
}

function success(request: NextRequest, learnerId: string, numbers: number[]) {
  const response = NextResponse.json({ numbers }, { headers });
  response.cookies.set(COOKIE_NAME, learnerId, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365,
    secure: request.nextUrl.protocol === "https:",
  });
  return response;
}

export async function GET(request: NextRequest) {
  try {
    const learnerId = learnerFor(request);
    const existing = isLearnerId(request.cookies.get(COOKIE_NAME)?.value);
    const numbers = existing ? await getDifficultNumbers(getDatabase(), learnerId) : [];
    return success(request, learnerId, numbers);
  } catch {
    return NextResponse.json({ error: "苦手単語を読み込めませんでした。" }, { status: 503, headers });
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "この操作は許可されていません。" }, { status: 403, headers });
  let payload;
  try { payload = readDifficultPayload(await request.json()); } catch { payload = null; }
  if (!payload) return NextResponse.json({ error: "単語番号または登録状態が不正です。" }, { status: 400, headers });
  try {
    const learnerId = learnerFor(request);
    const numbers = await setDifficultWord(getDatabase(), learnerId, payload.number, payload.saved);
    return success(request, learnerId, numbers);
  } catch {
    return NextResponse.json({ error: "苦手単語の登録を保存できませんでした。" }, { status: 503, headers });
  }
}
