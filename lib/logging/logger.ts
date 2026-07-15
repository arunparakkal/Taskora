/**
 * Structured logger — emits single-line JSON to stdout/stderr. Works as-is
 * on Vercel (log drains / the dashboard's log viewer parse JSON lines) with
 * no extra service required. Swap in Sentry (or another provider) later by
 * changing the implementation of `write()` — call sites don't need to change.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  [key: string]: unknown;
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return { message: error.message, name: error.name, stack: error.stack };
  }
  return { message: String(error) };
}

function write(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };

  const line = JSON.stringify(entry);
  if (level === "error" || level === "warn") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== "production") write("debug", message, context);
  },
  info(message: string, context?: LogContext) {
    write("info", message, context);
  },
  warn(message: string, context?: LogContext) {
    write("warn", message, context);
  },
  /** Pass the caught value as `context.error` (or use `logger.exception`). */
  error(message: string, context?: LogContext) {
    write("error", message, context);
  },
  /** Convenience for `catch (error)` blocks — serializes the error for you. */
  exception(message: string, error: unknown, context?: LogContext) {
    write("error", message, { ...context, error: serializeError(error) });
  },
};
