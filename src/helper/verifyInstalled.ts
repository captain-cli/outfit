import { spawn } from "node:child_process";

import type {
    ExecutionRequest
} from "./types.js";

export interface InstalledPackageVerification {
    name: string;
    expectedVersion?: string;
    installedVersion?: string;
    installed: boolean;
    versionMatches: boolean;
}

export interface PostInstallVerification {
    successful: boolean;
    packages: InstalledPackageVerification[];
}

interface ProcessResult {
    code: number | null;
    stdout: string;
    stderr: string;
}

function run(
    executable: string,
    args: string[]
): Promise<ProcessResult> {
    return new Promise((resolve, reject) => {
        const child = spawn(
            executable,
            args,
            {
                shell: false,
                stdio: [
                    "ignore",
                    "pipe",
                    "pipe"
                ],
                env: {
                    PATH:
                        "/usr/sbin:/usr/bin:/sbin:/bin"
                }
            }
        );

        let stdout = "";
        let stderr = "";

        child.stdout.setEncoding("utf8");
        child.stderr.setEncoding("utf8");

        child.stdout.on("data", (chunk) => {
            stdout += chunk;
        });

        child.stderr.on("data", (chunk) => {
            stderr += chunk;
        });

        child.on("error", reject);

        child.on("close", (code) => {
            resolve({
                code,
                stdout,
                stderr
            });
        });
    });
}

export async function verifyInstalled(
    request: ExecutionRequest
): Promise<PostInstallVerification> {
    if (request.packageManager !== "apt") {
        throw new Error(
            `Post-install verification does not support '${request.packageManager}'`
        );
    }

    const results:
        InstalledPackageVerification[] = [];

    for (const pkg of request.packages) {
        const result = await run(
            "/usr/bin/dpkg-query",
            [
                "-W",
                "-f=${Status}|${Version}",
                pkg.name
            ]
        );

        if (result.code !== 0) {
            results.push({
                name: pkg.name,
                expectedVersion: pkg.version,
                installed: false,
                versionMatches: false
            });

            continue;
        }

        const [status, installedVersion] =
            result.stdout.trim().split("|");

        const installed =
            status === "install ok installed";

        const versionMatches =
            installed &&
            (
                pkg.version === undefined ||
                installedVersion === pkg.version
            );

        results.push({
            name: pkg.name,
            expectedVersion: pkg.version,
            installedVersion,
            installed,
            versionMatches
        });
    }

    return {
        successful:
            results.every(
                (result) =>
                    result.installed &&
                    result.versionMatches
            ),

        packages: results
    };
}