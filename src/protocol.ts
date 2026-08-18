export type ToolStatus = "success" | "warning" | "error" | "not-implemented";

export interface ToolEnvelope<T = unknown> {
  tool: string;
  version: string;
  operation: string;
  status: ToolStatus;
  changed: boolean;
  warnings: string[];
  errors: string[];
  result: T;
}

export function envelope<T>(tool: string, operation: string, status: ToolStatus, result: T, options: Partial<Pick<ToolEnvelope, "changed" | "warnings" | "errors">> = {}): ToolEnvelope<T> {
  return { tool, version: "0.1.0-dev.0", operation, status, changed: options.changed ?? false, warnings: options.warnings ?? [], errors: options.errors ?? [], result };
}
