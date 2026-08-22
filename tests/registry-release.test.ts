import test from "node:test";
import assert from "node:assert/strict";

import {
  mkdtemp,
  readFile,
  writeFile
} from "node:fs/promises";

import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadRegistry } from "../src/registry/loadRegistry.js";
import {writeSignedRegistryRelease} from "./support/signedRegistry.js";

import {
    generateKeyPairSync,
    sign
} from "node:crypto";

function buildSigningPayload(
    release: any
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
            release.digest.algorithm,

            value:
            release.digest.value
        },

        signing: {
            required:
            release.signing.required,

            algorithm:
            release.signing.algorithm,

            keyId:
            release.signing.keyId
        }
    });
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
    await writeSignedRegistryRelease(
        directory,
        original
    );
  }

  return directory;
}

async function loadFixtureRegistry(
    directory: string
) {
    return loadRegistry(
        directory,
        {
            trustRoot:
                join(
                    directory,
                    "trust"
                )
        }
    );
}

test(
    "loads registry when release integrity and signature are valid",
    async () => {
        const directory =
            await createFixture();

        const registry =
            await loadFixtureRegistry(
                directory
            );

        assert.equal(
            registry.version,
            "0.1.0"
        );
    }
);

test("rejects tampered registry content", async () => {
  const directory = await createFixture({
    tamper: true
  });

  await assert.rejects(
    () => loadFixtureRegistry(directory),
    /digest mismatch/
  );
});

test("rejects missing registry release manifest", async () => {
  const directory = await createFixture({
    omitRelease: true
  });

  await assert.rejects(
    () => loadFixtureRegistry(directory)
  );
});

test(
    "rejects unsupported digest algorithm",
    async () => {
      const directory =
          await createFixture();

      const releasePath =
          join(
              directory,
              "registry.release.json"
          );

      const release =
          JSON.parse(
              await readFile(
                  releasePath,
                  "utf8"
              )
          );

      release.digest.algorithm =
          "md5";

      await writeFile(
          releasePath,
          JSON.stringify(
              release,
              null,
              2
          ),
          "utf8"
      );

      await assert.rejects(
          () =>
              loadFixtureRegistry(
                  directory
              ),
          /Unsupported registry digest algorithm/
      );
    }
);

test(
    "rejects signed release with missing signature",
    async () => {
        const directory =
            await createFixture();

        const releasePath =
            join(
                directory,
                "registry.release.json"
            );

        const release =
            JSON.parse(
                await readFile(
                    releasePath,
                    "utf8"
                )
            );

        delete release.signing.signature;

        await writeFile(
            releasePath,
            JSON.stringify(
                release,
                null,
                2
            ),
            "utf8"
        );

        await assert.rejects(
            () =>
                loadFixtureRegistry(
                    directory
                ),
            /signature/i
        );
    }
);

test(
    "rejects release signed by unknown key id",
    async () => {
        const directory =
            await createFixture();

        const releasePath =
            join(
                directory,
                "registry.release.json"
            );

        const release =
            JSON.parse(
                await readFile(
                    releasePath,
                    "utf8"
                )
            );

        release.signing.keyId =
            "captain.registry.unknown.v1";

        await writeFile(
            releasePath,
            JSON.stringify(
                release,
                null,
                2
            ),
            "utf8"
        );

        await assert.rejects(
            () =>
                loadFixtureRegistry(
                    directory
                ),
            /trusted registry signing key/i
        );
    }
);

test(
    "rejects invalid registry signing key id",
    async () => {
        const directory =
            await createFixture();

        const releasePath =
            join(
                directory,
                "registry.release.json"
            );

        const release =
            JSON.parse(
                await readFile(
                    releasePath,
                    "utf8"
                )
            );

        release.signing.keyId =
            "../../etc/passwd";

        await writeFile(
            releasePath,
            JSON.stringify(
                release,
                null,
                2
            ),
            "utf8"
        );

        await assert.rejects(
            () =>
                loadFixtureRegistry(
                    directory
                ),
            /signing key id is invalid/i
        );
    }
);

test(
    "rejects release signed by untrusted key material",
    async () => {
        const directory =
            await createFixture();

        const releasePath =
            join(
                directory,
                "registry.release.json"
            );

        const release =
            JSON.parse(
                await readFile(
                    releasePath,
                    "utf8"
                )
            );

        const {
            privateKey
        } = generateKeyPairSync(
            "ed25519"
        );

        const payload =
            buildSigningPayload(
                release
            );

        release.signing.signature =
            sign(
                null,
                Buffer.from(
                    payload,
                    "utf8"
                ),
                privateKey
            ).toString(
                "base64"
            );

        await writeFile(
            releasePath,
            JSON.stringify(
                release,
                null,
                2
            ),
            "utf8"
        );

        await assert.rejects(
            () =>
                loadFixtureRegistry(
                    directory
                ),
            /signature verification failed/i
        );
    }
);

test(
    "rejects modified signed release metadata",
    async () => {
        const directory =
            await createFixture();

        const releasePath =
            join(
                directory,
                "registry.release.json"
            );

        const release =
            JSON.parse(
                await readFile(
                    releasePath,
                    "utf8"
                )
            );

        release.version =
            "9.9.9";

        await writeFile(
            releasePath,
            JSON.stringify(
                release,
                null,
                2
            ),
            "utf8"
        );

        await assert.rejects(
            () =>
                loadFixtureRegistry(
                    directory
                ),
            /signature verification failed/i
        );
    }
);