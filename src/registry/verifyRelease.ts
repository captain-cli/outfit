import {
  createHash,
  verify
} from "node:crypto";

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

/* canonical payload builder */
function buildSigningPayload(
    release: RegistryReleaseManifest
): string {
  return JSON.stringify({
    version:
    release.version,

    schemaVersion:
    release.schemaVersion,

    registryFile:
    release.registryFile,

    digest: {
      algorithm:
      release.digest?.algorithm,

      value:
      release.digest?.value
    },

    signing: {
      required:
      release.signing?.required,

      algorithm:
      release.signing?.algorithm,

      keyId:
      release.signing?.keyId
    }
  });
}

export interface RegistrySignatureResult {
  algorithm: "ed25519";
  keyId: string;
  verified: true;
}

export function verifyRegistrySignature(
    release: RegistryReleaseManifest,
    publicKey: string
): RegistrySignatureResult {
  if (
      release.signing?.required !== true
  ) {
    throw new Error(
        "Registry release signature is required"
    );
  }

  if (
      release.signing.algorithm !==
      "ed25519"
  ) {
    throw new Error(
        `Unsupported registry signing algorithm: ${
            release.signing.algorithm ??
            "missing"
        }`
    );
  }

  if (
      typeof release.signing.keyId !==
      "string" ||
      release.signing.keyId.trim() ===
      ""
  ) {
    throw new Error(
        "Registry signing key id is missing"
    );
  }

  if (
      typeof release.signing.signature !==
      "string" ||
      release.signing.signature.trim() ===
      ""
  ) {
    throw new Error(
        "Registry signature is missing"
    );
  }

  const payload =
      buildSigningPayload(
          release
      );

  const valid =
      verify(
          null,
          Buffer.from(
              payload,
              "utf8"
          ),
          publicKey,
          Buffer.from(
              release.signing.signature,
              "base64"
          )
      );

  if (!valid) {
    throw new Error(
        "Registry signature verification failed"
    );
  }

  return {
    algorithm:
        "ed25519",

    keyId:
    release.signing.keyId,

    verified:
        true
  };
}