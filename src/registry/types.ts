export interface RegisteredSource {
  id: string;

  type:
    | "distribution"
    | "vendor"
    | "community"
    | "organization";

  platforms: string[];

  packageManagers: string[];

  trustLevel?:
    | "core"
    | "verified"
    | "community"
    | "organization";
}

export interface DependencyMapping {
  platform: string;
  packageManager: string;
  package: string;
  source: string;
}

export interface DependencyDefinition {
  id: string;

  aliases?: string[];

  mappings: DependencyMapping[];
}

export interface OutfitRegistry {
  version: string;

  sources: RegisteredSource[];

  dependencies: DependencyDefinition[];
}

export interface DependencyResolution {
  requirement: string;

  canonicalId: string;

  platform: string;

  packageManager: string;

  package: string;

  source: string;

  registryVersion: string;
}
