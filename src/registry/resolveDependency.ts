import type {
  DependencyResolution,
  OutfitRegistry
} from "./types.js";

export function resolve(
  registry: OutfitRegistry,
  requested: string,
  platform: string,
  packageManager: string
): DependencyResolution {
  const dependency = registry.dependencies.find(
    (entry) =>
      entry.id === requested ||
      entry.aliases?.includes(requested)
  );

  if (!dependency) {
    throw new Error(
      `Unknown canonical dependency: ${requested}`
    );
  }

  const mapping = dependency.mappings.find(
    (entry) =>
      entry.platform === platform &&
      entry.packageManager === packageManager
  );

  if (!mapping) {
    throw new Error(
      `No mapping for ${dependency.id} on ${platform}/${packageManager}`
    );
  }

  return {
    requirement: requested,
    canonicalId: dependency.id,
    platform,
    packageManager,
    package: mapping.package,
    source: mapping.source,
    registryVersion: registry.version
  };
}
