import { arch, platform } from "node:os";

import {
  detectLinuxDistribution
} from "./osRelease.js";

import {
  detectPackageManagers,
  selectPackageManager
} from "./packageManagers.js";

import type {
  HostInfo,
  OperatingSystem
} from "./types.js";

function normalizeOperatingSystem(): OperatingSystem {
  switch (platform()) {
    case "linux":
      return "linux";

    case "win32":
      return "windows";

    case "darwin":
      return "darwin";

    default:
      return "unknown";
  }
}

export function detectHost(): HostInfo {
  const os = normalizeOperatingSystem();

  if (os !== "linux") {
    return {
      os,
      architecture: arch(),
      packageManagers: []
    };
  }

  const distribution = detectLinuxDistribution();
  const packageManagers = detectPackageManagers();

  return {
    os,
    architecture: arch(),
    distribution,
    packageManagers,
    selectedPackageManager: selectPackageManager(
      distribution.family,
      packageManagers
    )
  };
}

export * from "./types.js";
export * from "./osRelease.js";
export * from "./packageManagers.js";
