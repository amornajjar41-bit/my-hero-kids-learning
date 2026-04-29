/**
 * Zero-dependency JSON logger.
 * Writes structured JSON to stdout synchronously — no worker threads,
 * no file-system paths, no dynamic imports. Safe for any serverless runtime.
 */

type Bindings = Record<string, unknown>;

export interface AppLogger {
  info(obj: Bindings | string, msg?: string): void;
  error(obj: Bindings | string, msg?: string): void;
  warn(obj: Bindings | string, msg?: string): void;
  debug(obj: Bindings | string, msg?: string): void;
  child(bindings: Bindings): AppLogger;
}

const LEVELS: Record<string, number> = { debug: 20, info: 30, warn: 40, error: 50 };

function makeLogger(base: Bindings = {}): AppLogger {
  function log(level: string, obj: Bindings | string, msg?: string): void {
    const isObj = obj !== null && typeof obj === "object";
    const entry = JSON.stringify({
      level: LEVELS[level] ?? 30,
      time: Date.now(),
      ...base,
      ...(isObj ? (obj as Bindings) : {}),
      msg: isObj ? (msg ?? "") : (obj as string),
    });
    process.stdout.write(entry + "\n");
  }
  return {
    info: (o, m) => log("info", o, m),
    error: (o, m) => log("error", o, m),
    warn: (o, m) => log("warn", o, m),
    debug: (o, m) => log("debug", o, m),
    child: (bindings) => makeLogger({ ...base, ...bindings }),
  };
}

export const logger: AppLogger = makeLogger();
