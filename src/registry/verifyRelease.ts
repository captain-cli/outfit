import { createHash } from "node:crypto";

import type {
  RegistryReleaseManifest
} from "./releaseTypes.js";

export interface RegistryIntegrityResult {
  algorithm: "sha256";
  digest: string;
  verified: true;
}

function sha256(buffer: Buffer): string {
  return createHash("sha256")
    .update(buffer)
    .digest("hex");
}

export function verifyRegistryIntegrity(
  registryBuffer: Buffer,
  release: RegistryReleaseManifest
): RegistryIntegrityResult {
  if (!release || typeof release !== "object") {
    throw new Error(
      "Registry release manifest is invalid"
    );
  }

  if (release.digest?.algorithm !== "sha256") {
    throw new Error(
      `Unsupported registry digest algorithm: ${
        release.digest?.algorithm ?? "missing"
      }`
    );
  }

  const expected = release.digest.value;

  if (
    typeof expected !== "string" ||
    expected.trim() === ""
  ) {
    throw new Error(
      "Registry release digest is missing"
    );
  }

  const actual = sha256(registryBuffer);

  if (actual !== expected) {
    throw new Error(
      "Registry integrity verification failed: digest mismatch"
    );
  }

  return {
    algorithm: "sha256",
    digest: actual,
    verified: true
  };
}
