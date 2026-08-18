export function envelope(tool, operation, status, result, options = {}) {
    return { tool, version: "0.1.0-dev.0", operation, status, changed: options.changed ?? false, warnings: options.warnings ?? [], errors: options.errors ?? [], result };
}
//# sourceMappingURL=protocol.js.map