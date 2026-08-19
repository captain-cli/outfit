import { spawn } from "node:child_process";

import type {
    ExecutionRequest
} from "./types.js";

import type {
    AptExecutionPreview
} from "./aptExecutor.js";

import type {
    ExecutionReceipt
} from "./receipt.js";

export async function executeNative(
    request: ExecutionRequest,
    native: AptExecutionPreview
): Promise<ExecutionReceipt> {
    if (
        native.executable !==
        "/usr/bin/apt-get"
    ) {
        throw new Error(
            "Privileged executor rejected unexpected executable"
        );
    }

    if (
        native.executed !== false
    ) {
        throw new Error(
            "Invalid native execution descriptor"
        );
    }

    const startedAt =
        new Date().toISOString();

    return new Promise(
        (resolve, reject) => {
            const child = spawn(
                native.executable,
                native.args,
                {
                    shell: false,

                    stdio: [
                        "ignore",
                        "pipe",
                        "pipe"
                    ],

                    env: {
                        PATH:
                            "/usr/sbin:/usr/bin:/sbin:/bin",

                        DEBIAN_FRONTEND:
                            "noninteractive"
                    }
                }
            );

            let stdout = "";
            let stderr = "";

            child.stdout.setEncoding(
                "utf8"
            );

            child.stderr.setEncoding(
                "utf8"
            );

            child.stdout.on(
                "data",
                (chunk) => {
                    stdout += chunk;
                }
            );

            child.stderr.on(
                "data",
                (chunk) => {
                    stderr += chunk;
                }
            );

            child.on(
                "error",
                reject
            );

            child.on(
                "close",
                (code) => {
                    const finishedAt =
                        new Date().toISOString();

                    resolve({
                        planFingerprint:
                        request.planFingerprint,

                        executable:
                        native.executable,

                        args: [
                            ...native.args
                        ],

                        startedAt,
                        finishedAt,

                        exitCode: code,

                        stdout,
                        stderr,

                        successful:
                            code === 0
                    });
                }
            );
        }
    );
}