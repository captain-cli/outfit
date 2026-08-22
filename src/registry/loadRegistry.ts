import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { OutfitRegistry } from "./types.js";
import type {
  RegistryReleaseManifest
} from "./releaseTypes.js";

import { validateRegistry } from "./validateRegistry.js";
import { verifySources } from "./verifySources.js";
import {
  verifyRegistryIntegrity,
  verifyRegistrySignature
} from "./verifyRelease.js";

import {
  loadTrustedKey
} from "./loadTrustedKey.js";

export interface RegistryLoadOptions {
  trustRoot?: string;
}

export async function loadRegistry(
  path: string,
  options: RegistryLoadOptions = {}
): Promise<OutfitRegistry> {
  const releasePath = join(
    path,
    "registry.release.json"
  );

  const releaseRaw = await readFile(
    releasePath,
    "utf8"
  );

  let release: RegistryReleaseManifest;

  try {
    release = JSON.parse(releaseRaw);
  } catch (error) {
    throw new Error(
      `Unable to parse registry release manifest: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`
    );
  }

  const registryPath = join(
    path,
    release.registryFile
  );

  const registryBuffer = await readFile(
    registryPath
  );

  // Security boundary:
  // verify bytes before parsing registry contents.
  verifyRegistryIntegrity(
    registryBuffer,
    release
  );

  const trustRoot =
      options.trustRoot ??
      "/etc/captain/outfit/trust";

  const publicKey =
      await loadTrustedKey(
          release,
          trustRoot
      );

  verifyRegistrySignature(
      release,
      publicKey
  );

  let parsed: unknown;

  try {
    parsed = JSON.parse(
      registryBuffer.toString("utf8")
    );
  } catch (error) {
    throw new Error(
      `Unable to parse registry JSON: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`
    );
  }

  const validated = validateRegistry(
    parsed as OutfitRegistry
  );

  return verifySources(validated);
}
