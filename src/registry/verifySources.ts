import type {
  OutfitRegistry,
  RegisteredSource
} from "./types.js";

function sourceSupportsPlatform(
  source: RegisteredSource,
  platform: string
): boolean {
  return source.platforms.includes(platform);
}

function sourceSupportsPackageManager(
  source: RegisteredSource,
  packageManager: string
): boolean {
  return source.packageManagers.includes(packageManager);
}

export function verifySources(
  registry: OutfitRegistry
): OutfitRegistry {
  const sources = new Map(
    registry.sources.map((source) => [
      source.id,
      source
    ])
  );

  for (const dependency of registry.dependencies) {
    for (const mapping of dependency.mappings) {
      const source = sources.get(mapping.source);

      if (!source) {
        throw new Error(
          `Mapping '${dependency.id}' references unregistered source '${mapping.source}'`
        );
      }

      if (
        !sourceSupportsPlatform(
          source,
          mapping.platform
        )
      ) {
        throw new Error(
          `Source '${source.id}' is not registered for platform '${mapping.platform}'`
        );
      }

      if (
        !sourceSupportsPackageManager(
          source,
          mapping.packageManager
        )
      ) {
        throw new Error(
          `Source '${source.id}' is not registered for package manager '${mapping.packageManager}'`
        );
      }
    }
  }

  return registry;
}
