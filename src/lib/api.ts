export type ApiResponse<T> = { success: true; data: T } | { success: false; error: { code: string; message: string } };

export function ok<T>(data: T): Response {
  return Response.json({ success: true, data } satisfies ApiResponse<T>);
}

export function fail(code: string, message: string, status = 400): Response {
  return Response.json({ success: false, error: { code, message } } satisfies ApiResponse<never>, { status });
}
