import test from "node:test";
import assert from "node:assert/strict";

import {
    createApproval
} from "../src/execution/createApproval.js";

import {
    revalidatePlan
} from "../src/execution/revalidatePlan.js";

import {
    executePlan
} from "../src/execution/executePlan.js";

import type {
    InstallationPlan
} from "../src/planning/types.js";

function createPlan(): InstallationPlan {
    return {
        id: "gate-test",
        createdAt:
            "2026-08-18T00:00:00Z",

        platform: "ubuntu",
        packageManager: "apt",
        registryVersion:
            "0.1.0-dev.0",

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
                    name:
                        "libasound2-dev",
                    action: "install",
                    targetVersion:
                        "1.2.6.1-1ubuntu1.2",
                    architecture: "amd64"
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
    "validated unchanged plan reaches execution gate",
    () => {
        const approvedPlan =
            createPlan();

        const approval =
            createApproval(
                approvedPlan
            );

        const currentPlan =
            createPlan();

        const validation =
            revalidatePlan(
                approvedPlan,
                currentPlan,
                approval
            );

        const result =
            executePlan(validation);

        assert.equal(
            result.status,
            "validated"
        );

        assert.equal(
            result.executed,
            false
        );
    }
);

test(
    "tampered stored plan is rejected",
    () => {
        const approvedPlan =
            createPlan();

        const approval =
            createApproval(
                approvedPlan
            );

        approvedPlan.transaction
            .changes[0]
            .targetVersion =
            "9.9.9-malicious";

        const currentPlan =
            createPlan();

        assert.throws(
            () =>
                revalidatePlan(
                    approvedPlan,
                    currentPlan,
                    approval
                ),
            /fingerprint does not match/
        );
    }
);

test(
    "changed current transaction is rejected",
    () => {
        const approvedPlan =
            createPlan();

        const approval =
            createApproval(
                approvedPlan
            );

        const currentPlan =
            createPlan();

        currentPlan.transaction
            .changes[0]
            .targetVersion =
            "1.2.6.1-1ubuntu1.3";

        assert.throws(
            () =>
                revalidatePlan(
                    approvedPlan,
                    currentPlan,
                    approval
                ),
            /Current plan does not match approved plan/
        );
    }
);

test(
    "changed registry version is rejected",
    () => {
        const approvedPlan =
            createPlan();

        const approval =
            createApproval(
                approvedPlan
            );

        const currentPlan =
            createPlan();

        currentPlan.registryVersion =
            "0.2.0";

        assert.throws(
            () =>
                revalidatePlan(
                    approvedPlan,
                    currentPlan,
                    approval
                ),
            /Current plan does not match approved plan/
        );
    }
);

test(
    "approved plan becomes satisfied when current transaction has no changes",
    () => {
        const approvedPlan =
            createPlan();

        const approval =
            createApproval(
                approvedPlan
            );

        const currentPlan =
            createPlan();

        currentPlan.transaction
            .changes = [];

        const result =
            revalidatePlan(
                approvedPlan,
                currentPlan,
                approval
            );

        assert.equal(
            result.state,
            "satisfied"
        );

        assert.equal(
            result.matches,
            false
        );
    }
);

test(
    "empty transaction does not hide changed desired state",
    () => {
        const approvedPlan =
            createPlan();

        const approval =
            createApproval(
                approvedPlan
            );

        const currentPlan =
            createPlan();

        currentPlan.requirements[0]
            .resolution.package =
            "something-else";

        currentPlan.transaction
            .requestedPackages = [
            "something-else"
        ];

        currentPlan.transaction
            .changes = [];

        assert.throws(
            () =>
                revalidatePlan(
                    approvedPlan,
                    currentPlan,
                    approval
                ),
            /Current plan does not match approved plan/
        );
    }
);