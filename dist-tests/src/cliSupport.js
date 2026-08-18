import { parseArgs } from "node:util";
export function parseCli() {
    const parsed = parseArgs({
        allowPositionals: true,
        options: {
            json: { type: "boolean", default: false },
            verbose: { type: "boolean", short: "v", default: false },
            quiet: { type: "boolean", short: "q", default: false },
            help: { type: "boolean", short: "h", default: false },
            version: { type: "boolean", default: false },
            manifest: { type: "string" },
            target: { type: "string" },
            path: { type: "string" },
            output: { type: "string" },
            registry: { type: "string" },
            reveal: { type: "boolean", default: false },
            length: { type: "string" },
        },
    });
    return parsed;
}
export function print(value, asJson = false) {
    if (asJson)
        console.log(JSON.stringify(value, null, 2));
    else if (typeof value === "string")
        console.log(value);
    else
        console.log(JSON.stringify(value, null, 2));
}
//# sourceMappingURL=cliSupport.js.map