import * as Sentry from "@sentry/nextjs";

function hasDsn(): boolean {
  return Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
}

export function captureMonitoringException(
  error: unknown,
  context?: Record<string, unknown>
): void {
  if (!hasDsn()) return;

  Sentry.captureException(error, context ? { extra: context } : undefined);
}
