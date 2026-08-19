import test from "node:test";
import assert from "node:assert/strict";

import {
    fingerprintPlan
} from "../src/planning/fingerprintPlan.js";

import {
    validateApprovedPlan
} from "../src/execution/validateApprovedPlan.js";

import type {
    InstallationPlan
} from "../src/planning/types.js";

import type {
    ApprovedPlan
} from "../src/execution/types.js";

function plan(): InstallationPlan {
    return {
        id: "abc",
        createdAt: new Date().toISOString(),

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
                        "1.2.6.1-1ubuntu1.2"
                }
            ],

            rawOutput: "",
            requiresElevation: true,
            successful: true,
            warnings: []
        },

        requiresElevation: true
    };
}

test(
    "approved unchanged plan validates",
    () => {
        const current = plan();

        const approval: ApprovedPlan = {
            planId: current.id,
            fingerprint:
                fingerprintPlan(current),
            approvedAt:
                new Date().toISOString(),
            registryVersion:
            current.registryVersion,
            platform: current.platform,
            packageManager:
            current.packageManager
        };

        assert.doesNotThrow(() =>
            validateApprovedPlan(
                current,
                approval
            )
        );
    }
);

test(
    "changed transaction rejects approval",
    () => {
        const approved = plan();

        const approval: ApprovedPlan = {
            planId: approved.id,
            fingerprint:
                fingerprintPlan(approved),
            approvedAt:
                new Date().toISOString(),
            registryVersion:
            approved.registryVersion,
            platform:
            approved.platform,
            packageManager:
            approved.packageManager
        };

        const current = plan();

        current.transaction.changes[0]
            .targetVersion =
            "9.9.9-malicious";

        assert.throws(
            () =>
                validateApprovedPlan(
                    current,
                    approval
                ),
            /fingerprint does not match/
        );
    }
);