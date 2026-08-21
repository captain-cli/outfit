import {
    generateKeyPairSync,
    sign
} from "node:crypto";

import {
    mkdir,
    writeFile
} from "node:fs/promises";

import {
    join
} from "node:path";

import {
    createHash
} from "node:crypto";

import type {
    RegistryReleaseManifest
} from "../../src/registry/releaseTypes.js";

function buildSigningPayload(
    release: RegistryReleaseManifest
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

export async function writeSignedRegistryRelease(
    registryDir: string,
    registryJson: string,
    version = "0.1.0-dev.0"
): Promise<void> {
    const {
        publicKey,
        privateKey
    } = generateKeyPairSync(
        "ed25519",
        {
            publicKeyEncoding: {
                type: "spki",
                format: "pem"
            },

            privateKeyEncoding: {
                type: "pkcs8",
                format: "pem"
            }
        }
    );

    const keyId =
        "captain.registry.test.v1";

    const digest =
        createHash("sha256")
            .update(registryJson)
            .digest("hex");

    const release:
        RegistryReleaseManifest = {
        version,

        schemaVersion:
            "0.1.0",

        registryFile:
            "registry.json",

        digest: {
            algorithm:
                "sha256",

            value:
            digest
        },

        signing: {
            required:
                true,

            algorithm:
                "ed25519",

            keyId
        }
    };

    const payload =
        buildSigningPayload(
            release
        );

    const signature =
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

    release.signing.signature =
        signature;

    const trustDir =
        join(
            registryDir,
            "trust"
        );

    await mkdir(
        trustDir,
        {
            recursive: true
        }
    );

    await writeFile(
        join(
            trustDir,
            `${keyId}.pem`
        ),
        publicKey,
        "utf8"
    );

    await writeFile(
        join(
            registryDir,
            "registry.release.json"
        ),
        JSON.stringify(
            release,
            null,
            2
        ),
        "utf8"
    );
}