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

function parseDnfTransaction(
  _output: string
): TransactionPackage[] {
  /*
   * Intentionally conservative for the first slice.
   *
   * We'll add fixture-driven parsing from real Fedora
   * transaction output instead of guessing.
   */
  return [];
}

export class DnfAdapter
  implements PackageManagerAdapter {

  readonly name = "dnf";

  constructor(
    private readonly executable =
      "/usr/bin/dnf"
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
        "install",
        "--assumeno",
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
      changes: parseDnfTransaction(rawOutput),
      rawOutput,
      requiresElevation: true,

      /*
       * DNF may exit non-zero because --assumeno
       * intentionally rejects the final transaction.
       * We will refine this after capturing Fedora fixtures.
       */
      successful: true,

      warnings: []
    };
  }
}
