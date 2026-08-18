import { randomUUID } from "node:crypto";

import type {
  PackageManagerAdapter
} from "../adapters/packageManager.js";

import type {
  DependencyResolution
} from "../registry/types.js";

import type {
  InstallationPlan
} from "./types.js";

export async function buildInstallationPlan(
  resolutions: DependencyResolution[],
  adapter: PackageManagerAdapter
): Promise<InstallationPlan> {
  if (resolutions.length === 0) {
    throw new Error(
      "Cannot build installation plan without dependency resolutions"
    );
  }

  const first = resolutions[0];

  for (const resolution of resolutions) {
    if (
      resolution.platform !== first.platform
    ) {
      throw new Error(
        "Installation plan contains multiple platforms"
      );
    }

    if (
      resolution.packageManager !==
      first.packageManager
    ) {
      throw new Error(
        "Installation plan contains multiple package managers"
      );
    }

    if (
      resolution.registryVersion !==
      first.registryVersion
    ) {
      throw new Error(
        "Installation plan contains multiple registry versions"
      );
    }
  }

  const packages = [
    ...new Set(
      resolutions.map(
        (resolution) => resolution.package
      )
    )
  ];

  const transaction =
    await adapter.previewInstall(packages);

  if (!transaction.successful) {
    throw new Error(
      `Package transaction preview failed for ${adapter.name}`
    );
  }

  return {
    id: randomUUID(),

    createdAt: new Date().toISOString(),

    platform: first.platform,

    packageManager:
      first.packageManager,

    registryVersion:
      first.registryVersion,

    requirements:
      resolutions.map((resolution) => ({
        resolution
      })),

    transaction,

    requiresElevation:
      transaction.requiresElevation
  };
}
