import test from "node:test";
import assert from "node:assert/strict";

import {
    fingerprintPlan
} from "../src/planning/fingerprintPlan.js";

import type {
    InstallationPlan
} from "../src/planning/types.js";

function plan(): InstallationPlan {
    return {
        id: "plan-one",
        createdAt: "2026-08-18T00:00:00Z",

        platform: "ubuntu",
        packageManager: "apt",
        registryVersion: "0.1.0-dev.0",

        requirements: [
            {
                resolution: {
                    requirement:
                        "audio.alsa.development",
                    canonicalId:
                        "audio.alsa.development",
                    platform: "ubuntu",
                    packageManager: "apt",
                    package: "libasound2-dev",
                    source: "ubuntu.official",
                    registryVersion:
                        "0.1.0-dev.0"
                }
            }
        ],

        transaction: {
            packageManager: "apt",
            requestedPackages: [
                "libasound2-dev"
            ],

            changes: [
                {
                    name: "libasound2-dev",
                    action: "install",
                    targetVersion:
                        "1.2.6.1-1ubuntu1.2",
                    architecture: "amd64",
                    repositoryHints: [
                        "Ubuntu:22.04/jammy-security",
                        "Ubuntu:22.04/jammy-updates"
                    ]
                }
            ],

            rawOutput: "diagnostic text",
            requiresElevation: true,
            successful: true,
            warnings: []
        },

        requiresElevation: true
    };
}

test(
    "same effective plan produces same fingerprint",
    () => {
        const first = plan();
        const second = plan();

        second.id = "totally-different-id";
        second.createdAt =
            "2030-01-01T00:00:00Z";
        second.transaction.rawOutput =
            "different diagnostic output";

        assert.deepEqual(
            fingerprintPlan(first),
            fingerprintPlan(second)
        );
    }
);

test(
    "changed target package version changes fingerprint",
    () => {
        const first = plan();
        const second = plan();

        second.transaction.changes[0]
            .targetVersion =
            "1.2.6.1-1ubuntu1.3";

        assert.notEqual(
            fingerprintPlan(first).value,
            fingerprintPlan(second).value
        );
    }
);

test(
    "changed package changes fingerprint",
    () => {
        const first = plan();
        const second = plan();

        second.transaction.changes[0].name =
            "some-other-package";

        assert.notEqual(
            fingerprintPlan(first).value,
            fingerprintPlan(second).value
        );
    }
);