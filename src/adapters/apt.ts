import { spawn } from "node:child_process";

import type {
  PackageManagerAdapter,
  TransactionPackage,
  TransactionPreview
} from "./packageManager.js";

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
        ]
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

export function parseAptSimulation(
    output: string
): TransactionPackage[] {
  const changes: TransactionPackage[] = [];

  for (const line of output.split(/\r?\n/)) {
    const trimmed = line.trim();

    /*
     * Detailed Ubuntu/Debian format:
     *
     * Inst libasound2-dev
     *   (1.2.6.1-1ubuntu1.2
     *    Ubuntu:22.04/jammy-updates,
     *    Ubuntu:22.04/jammy-security
     *    [amd64])
     */
    if (trimmed.startsWith("Inst ")) {
      const detailed = trimmed.match(
          /^Inst\s+(\S+)(?:\s+\[([^\]]+)\])?\s+\((\S+)\s+(.+?)\s+\[([^\]]+)\]\)$/
      );

      if (detailed) {
        changes.push({
          name: detailed[1],
          action: detailed[2]
              ? "upgrade"
              : "install",
          currentVersion: detailed[2],
          targetVersion: detailed[3],
          repositoryHints: detailed[4]
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean),
          architecture: detailed[5]
        });

        continue;
      }

      /*
       * Fallback for simpler apt simulation formats.
       */
      const fallback = trimmed.match(
          /^Inst\s+(\S+)(?:\s+\[([^\]]+)\])?(?:\s+\(([^)\s]+))?/
      );

      if (fallback) {
        changes.push({
          name: fallback[1],
          action: fallback[2]
              ? "upgrade"
              : "install",
          currentVersion: fallback[2],
          targetVersion: fallback[3]
        });
      }

      continue;
    }

    /*
     * Example:
     * Remv old-package [1.0.0]
     */
    if (trimmed.startsWith("Remv ")) {
      const match = trimmed.match(
          /^Remv\s+(\S+)(?:\s+\[([^\]]+)\])?/
      );

      if (!match) {
        continue;
      }

      changes.push({
        name: match[1],
        action: "remove",
        currentVersion: match[2]
      });
    }
  }

  return changes;
}

export class AptAdapter
  implements PackageManagerAdapter {

  readonly name = "apt";

  constructor(
    private readonly executable =
      "/usr/bin/apt-get"
  ) {}

  async previewInstall(
    packages: string[]
  ): Promise<TransactionPreview> {
    if (packages.length === 0) {
      return {
        packageManager: this.name,
        requestedPackages: [],
        changes: [],
        rawOutput: "",
        requiresElevation: false,
        successful: true,
        warnings: []
      };
    }

    const result = await run(
      this.executable,
      [
        "--simulate",
        "install",
        "--",
        ...packages
      ]
    );

    const rawOutput = [
      result.stdout,
      result.stderr
    ]
      .filter(Boolean)
      .join("\n");

    return {
      packageManager: this.name,
      requestedPackages: packages,
      changes: parseAptSimulation(rawOutput),
      rawOutput,
      requiresElevation: true,
      successful: result.code === 0,
      warnings:
        result.code === 0
          ? []
          : [
              `APT simulation exited with code ${result.code}`
            ]
    };
  }
}
