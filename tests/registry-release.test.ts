import test from "node:test";
import assert from "node:assert/strict";

import {
  mkdtemp,
  writeFile
} from "node:fs/promises";

import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";

import { loadRegistry } from "../src/registry/loadRegistry.js";

function sha256(value: string): string {
  return createHash("sha256")
    .update(value)
    .digest("hex");
}

function validRegistry() {
  return {
    version: "0.1.0",

    sources: [
      {
        id: "ubuntu.official",
        type: "distribution",
        platforms: ["ubuntu"],
        packageManagers: ["apt"],
        trustLevel: "core"
      }
    ],

    dependencies: [
      {
        id: "audio.alsa.development",
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

async function createFixture(
  options: {
    tamper?: boolean;
    algorithm?: string;
    omitRelease?: boolean;
  } = {}
): Promise<string> {
  const directory = await mkdtemp(
    join(tmpdir(), "outfit-registry-")
  );

  const original = JSON.stringify(
    validRegistry(),
    null,
    2
  );

  const digest = sha256(original);

  const registryContents = options.tamper
    ? original.replace(
        "libasound2-dev",
        "some-other-package"
      )
    : original;

  await writeFile(
    join(directory, "registry.json"),
    registryContents,
    "utf8"
  );

  if (!options.omitRelease) {
    const release = {
      version: "0.1.0",
      schemaVersion: "0.1.0",
      registryFile: "registry.json",

      digest: {
        algorithm: options.algorithm ?? "sha256",
        value: digest
      },

      signing: {
        required: false
      }
    };

    await writeFile(
      join(directory, "registry.release.json"),
      JSON.stringify(release, null, 2),
      "utf8"
    );
  }

  return directory;
}

test("loads registry when release integrity is valid", async () => {
  const directory = await createFixture();

  const registry = await loadRegistry(directory);

  assert.equal(
    registry.version,
    "0.1.0"
  );
});

test("rejects tampered registry content", async () => {
  const directory = await createFixture({
    tamper: true
  });

  await assert.rejects(
    () => loadRegistry(directory),
    /digest mismatch/
  );
});

test("rejects missing registry release manifest", async () => {
  const directory = await createFixture({
    omitRelease: true
  });

  await assert.rejects(
    () => loadRegistry(directory)
  );
});

test("rejects unsupported digest algorithm", async () => {
  const directory = await createFixture({
    algorithm: "md5"
  });

  await assert.rejects(
    () => loadRegistry(directory),
    /Unsupported registry digest algorithm/
  );
});
