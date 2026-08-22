import {
    readFile
} from "node:fs/promises";

import {
    join
} from "node:path";

import type {
    RegistryReleaseManifest
} from "./releaseTypes.js";

export async function loadTrustedKey(
    release: RegistryReleaseManifest,
    trustRoot: string
): Promise<string> {
    const keyId =
        release.signing?.keyId;

    if (
        typeof keyId !== "string" ||
        keyId.trim() === ""
    ) {
        throw new Error(
            "Registry signing key id is missing"
        );
    }

    if (
        !/^[A-Za-z0-9._-]+$/.test(
            keyId
        )
    ) {
        throw new Error(
            "Registry signing key id is invalid"
        );
    }

    const keyPath =
        join(
            trustRoot,
            `${keyId}.pem`
        );

    try {
        return await readFile(
            keyPath,
            "utf8"
        );
    } catch (error) {
        throw new Error(
            `Trusted registry signing key '${keyId}' is unavailable: ${
                error instanceof Error
                    ? error.message
                    : String(error)
            }`
        );
    }
}