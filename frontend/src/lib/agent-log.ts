/** Dev-only debug logger: Vite middleware + Cursor ingest (best-effort). */
export function agentLog(payload: {
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
  runId?: string;
}) {
  const body = JSON.stringify({
    sessionId: '78e600',
    runId: payload.runId ?? 'confirm-email',
    hypothesisId: payload.hypothesisId,
    location: payload.location,
    message: payload.message,
    data: payload.data ?? {},
    timestamp: Date.now(),
  });

  // #region agent log
  fetch('/__agent_debug', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  }).catch(() => {});
  fetch('http://127.0.0.1:7530/ingest/e6f5fe77-9e75-413a-a6e5-206191b52f12', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '78e600',
    },
    body,
  }).catch(() => {});
  // #endregion
}
