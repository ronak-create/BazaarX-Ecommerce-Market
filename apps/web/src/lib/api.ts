import { NextResponse } from "next/server";
import type { ZodError } from "zod";

/** Standard JSON error envelope (matches @bazaarx/types ApiError). */
export function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export const unauthorized = () =>
  apiError("UNAUTHENTICATED", "No active session", 401);

export const forbidden = (message = "Not allowed") =>
  apiError("FORBIDDEN", message, 403);

export const notFound = (message = "Not found") =>
  apiError("NOT_FOUND", message, 404);

/** Turn a ZodError into a 422 with the first issue's message. */
export function validationError(err: ZodError) {
  const first = err.issues[0];
  const path = first?.path.join(".") || "body";
  return apiError("VALIDATION", `${path}: ${first?.message ?? "Invalid input"}`, 422);
}
