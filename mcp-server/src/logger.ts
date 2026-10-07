/**
 * Safe server-side logging for the AcademicFlow MCP server.
 *
 * Logs: tool name, privacy-safe user hint, success/failure, latency.
 * Never logs: tokens, passwords, service keys, private data.
 */

export function logToolCall(
  toolName: string,
  userId: string,
  success: boolean,
  durationMs: number,
  error?: string,
): void {
  const safeUserId = userId.slice(0, 8) + '…';
  const status = success ? 'OK' : 'FAIL';
  const suffix = error ? ` | ${error}` : '';
  console.error(
    `[MCP] ${new Date().toISOString()} | ${toolName} | user:${safeUserId} | ${status} | ${durationMs}ms${suffix}`,
  );
}
