import type {
  DependencyDefinition,
  DependencyMapping,
  OutfitRegistry,
  RegisteredSource
} from "./types.js";

function assertNonEmptyString(
  value: unknown,
  field: string
): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Registry validation failed: ${field} must be a non-empty string`);
  }
}

function validateSource(
  source: RegisteredSource,
  index: number
): void {
  assertNonEmptyString(source.id, `sources[${index}].id`);
  assertNonEmptyString(source.type, `sources[${index}].type`);

  if (!Array.isArray(source.platforms) || source.platforms.length === 0) {
    throw new Error(
      `Registry validation failed: sources[${index}].platforms must contain at least one platform`
    );
  }

  if (
    !Array.isArray(source.packageManagers) ||
    source.packageManagers.length === 0
  ) {
    throw new Error(
      `Registry validation failed: sources[${index}].packageManagers must contain at least one package manager`
    );
  }

  source.platforms.forEach((platform, platformIndex) =>
    assertNonEmptyString(
      platform,
      `sources[${index}].platforms[${platformIndex}]`
    )
  );

  source.packageManagers.forEach((manager, managerIndex) =>
    assertNonEmptyString(
      manager,
      `sources[${index}].packageManagers[${managerIndex}]`
    )
  );
}

function validateMapping(
  mapping: DependencyMapping,
  dependencyIndex: number,
  mappingIndex: number
): void {
  const prefix =
    `dependencies[${dependencyIndex}].mappings[${mappingIndex}]`;

  assertNonEmptyString(mapping.platform, `${prefix}.platform`);
  assertNonEmptyString(mapping.packageManager, `${prefix}.packageManager`);
  assertNonEmptyString(mapping.package, `${prefix}.package`);
  assertNonEmptyString(mapping.source, `${prefix}.source`);
}

function validateDependency(
  dependency: DependencyDefinition,
  index: number
): void {
  assertNonEmptyString(dependency.id, `dependencies[${index}].id`);

  if (!Array.isArray(dependency.mappings) || dependency.mappings.length === 0) {
    throw new Error(
      `Registry validation failed: dependencies[${index}].mappings must contain at least one mapping`
    );
  }

  if (dependency.aliases !== undefined) {
    if (!Array.isArray(dependency.aliases)) {
      throw new Error(
        `Registry validation failed: dependencies[${index}].aliases must be an array`
      );
    }

    dependency.aliases.forEach((alias, aliasIndex) =>
      assertNonEmptyString(
        alias,
        `dependencies[${index}].aliases[${aliasIndex}]`
      )
    );
  }

  dependency.mappings.forEach((mapping, mappingIndex) =>
    validateMapping(mapping, index, mappingIndex)
  );
}

export function validateRegistry(
  registry: OutfitRegistry
): OutfitRegistry {
  if (!registry || typeof registry !== "object") {
    throw new Error("Registry validation failed: registry must be an object");
  }

  assertNonEmptyString(registry.version, "version");

  if (!Array.isArray(registry.sources)) {
    throw new Error("Registry validation failed: sources must be an array");
  }

  if (!Array.isArray(registry.dependencies)) {
    throw new Error(
      "Registry validation failed: dependencies must be an array"
    );
  }

  registry.sources.forEach(validateSource);
  registry.dependencies.forEach(validateDependency);

  const sourceIds = new Set<string>();

  for (const source of registry.sources) {
    if (sourceIds.has(source.id)) {
      throw new Error(
        `Registry validation failed: duplicate source id '${source.id}'`
      );
    }

    sourceIds.add(source.id);
  }

  const dependencyIds = new Set<string>();
  const aliases = new Set<string>();

  for (const dependency of registry.dependencies) {
    if (dependencyIds.has(dependency.id)) {
      throw new Error(
        `Registry validation failed: duplicate dependency id '${dependency.id}'`
      );
    }

    dependencyIds.add(dependency.id);

    for (const alias of dependency.aliases ?? []) {
      if (aliases.has(alias) || dependencyIds.has(alias)) {
        throw new Error(
          `Registry validation failed: duplicate or conflicting alias '${alias}'`
        );
      }

      aliases.add(alias);
    }
  }

  return registry;
}
