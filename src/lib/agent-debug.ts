/** Debug-mode agent logging (session cfb690). Prefer same-origin so Tauri proxy does not rewrite. */
export function agentLog(
  hypothesisId: string,
  location: string,
  message: string,
  data?: Record<string, unknown>,
  runId = "pre-fix",
) {
  const payload = {
    sessionId: "cfb690",
    runId,
    hypothesisId,
    location,
    message,
    data: data ?? {},
    timestamp: Date.now(),
  };
  const body = JSON.stringify(payload);
  // Same-origin Vite middleware (not proxied)
  fetch("/__agent_debug", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  }).catch(() => {});
  // Original ingest endpoint (may be proxied/fail in Tauri)
  fetch("http://127.0.0.1:7614/ingest/0890e67c-84fa-41eb-9504-e9041c5378f3", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "cfb690",
    },
    body,
  }).catch(() => {});
}
