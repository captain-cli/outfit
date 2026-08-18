import test from "node:test";
import assert from "node:assert/strict";

import { validateRegistry } from "../src/registry/validateRegistry.js";
import { verifySources } from "../src/registry/verifySources.js";
import { resolve } from "../src/registry/resolveDependency.js";

import type { OutfitRegistry } from "../src/registry/types.js";

function createRegistry(): OutfitRegistry {
  return {
    version: "0.1.0",

    sources: [
      {
        id: "ubuntu.official",
        type: "distribution",
        platforms: ["ubuntu"],
        packageManagers: ["apt", "apt-get"],
        trustLevel: "core"
      }
    ],

    dependencies: [
      {
        id: "audio.alsa.development",
        aliases: ["alsa-dev"],

        mappings: [
          {
            platform: "ubuntu",
            packageManager: "apt",
            package: "libasound2-dev",
            source: "ubuntu.official"
          }
        ]
      }
    ]
  };
}

test("valid trusted mapping resolves", () => {
  const registry = createRegistry();

  validateRegistry(registry);
  verifySources(registry);

  const result = resolve(
    registry,
    "audio.alsa.development",
    "ubuntu",
    "apt"
  );

  assert.equal(result.canonicalId, "audio.alsa.development");
  assert.equal(result.package, "libasound2-dev");
  assert.equal(result.source, "ubuntu.official");
});

test("alias resolves to canonical dependency", () => {
  const registry = createRegistry();

  validateRegistry(registry);
  verifySources(registry);

  const result = resolve(
    registry,
    "alsa-dev",
    "ubuntu",
    "apt"
  );

  assert.equal(result.canonicalId, "audio.alsa.development");
});

test("unregistered source is rejected", () => {
  const registry = createRegistry();

  registry.dependencies[0].mappings[0].source =
    "bob-random-repo";

  validateRegistry(registry);

  assert.throws(
    () => verifySources(registry),
    /unregistered source/
  );
});

test("source cannot be used on unauthorized platform", () => {
  const registry = createRegistry();

  registry.dependencies[0].mappings[0].platform =
    "fedora";

  validateRegistry(registry);

  assert.throws(
    () => verifySources(registry),
    /not registered for platform/
  );
});

test("source cannot be used with unauthorized package manager", () => {
  const registry = createRegistry();

  registry.dependencies[0].mappings[0].packageManager =
    "dnf";

  validateRegistry(registry);

  assert.throws(
    () => verifySources(registry),
    /not registered for package manager/
  );
});

test("unknown dependency is rejected", () => {
  const registry = createRegistry();

  validateRegistry(registry);
  verifySources(registry);

  assert.throws(
    () =>
      resolve(
        registry,
        "does.not.exist",
        "ubuntu",
        "apt"
      ),
    /Unknown canonical dependency/
  );
});

test("missing platform mapping is rejected", () => {
  const registry = createRegistry();

  validateRegistry(registry);
  verifySources(registry);

  assert.throws(
    () =>
      resolve(
        registry,
        "audio.alsa.development",
        "fedora",
        "dnf"
      ),
    /No mapping/
  );
});
