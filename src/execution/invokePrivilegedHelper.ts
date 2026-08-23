import {
    spawn
} from "node:child_process";

import type {
    HelperResponse
} from "../helper/response.js";

export interface PrivilegedHelperInputs {
    manifest: string;
    registry: string;
    plan: string;
    approval: string;
}

export interface PrivilegedHelperResult {
    exitCode: number;
    response:
        HelperResponse | null;
    stderr: string;
}

const SUDO =
    "/usr/bin/sudo";

const HELPER =
    "/usr/lib/captain/outfit/outfit-helper";

export async function invokePrivilegedHelper(
    inputs: PrivilegedHelperInputs
): Promise<PrivilegedHelperResult> {
    const args = [
        HELPER,

        "--manifest",
        inputs.manifest,

        "--registry",
        inputs.registry,

        "--plan",
        inputs.plan,

        "--approval",
        inputs.approval,

        "--execute"
    ];

    return new Promise(
        (
            resolve,
            reject
        ) => {
            const child =
                spawn(
                    SUDO,
                    args,
                    {
                        stdio: [
                            "inherit",
                            "pipe",
                            "pipe"
                        ],

                        shell:
                            false
                    }
                );

            let stdout = "";
            let stderr = "";

            child.stdout?.setEncoding(
                "utf8"
            );

            child.stderr?.setEncoding(
                "utf8"
            );

            child.stdout?.on(
                "data",
                (chunk: string) => {
                    stdout += chunk;
                }
            );

            child.stderr?.on(
                "data",
                (chunk: string) => {
                    stderr += chunk;
                }
            );

            child.once(
                "error",
                reject
            );

            child.once(
                "exit",
                (
                    code,
                    signal
                ) => {
                    if (signal) {
                        reject(
                            new Error(
                                `Privileged helper terminated by signal ${signal}`
                            )
                        );

                        return;
                    }

                    let response:
                        HelperResponse | null =
                        null;

                    if (
                        stdout.trim()
                    ) {
                        try {
                            response =
                                JSON.parse(
                                    stdout
                                ) as HelperResponse;
                        } catch {
                            response =
                                null;
                        }
                    }

                    resolve({
                        exitCode:
                            code ?? 1,

                        response,

                        stderr
                    });
                }
            );
        }
    );
}