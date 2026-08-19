import test from "node:test";
import assert from "node:assert/strict";

import {
    mkdtemp,
    rm
} from "node:fs/promises";

import { tmpdir } from "node:os";
import { join } from "node:path";

import {
    createApproval
} from "../src/execution/createApproval.js";

import {
    readApproval
} from "../src/execution/readApproval.js";

import {
    writeApproval
} from "../src/execution/writeApproval.js";

import {
    validateApprovedPlan
} from "../src/execution/validateApprovedPlan.js";

import type {
    InstallationPlan
} from "../src/planning/types.js";

function createPlan(): InstallationPlan {
    return {
        id: "approval-test",
        createdAt:
            "2026-08-18T00:00:00Z",

        platform: "ubuntu",
        packageManager: "apt",
        registryVersion:
            "0.1.0-dev.0",

        requirements: [],

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
    "approval artifact round trips and validates",
    async () => {
        const dir = await mkdtemp(
            join(
                tmpdir(),
                "outfit-approval-"
            )
        );

        try {
            const path =
                join(
                    dir,
                    "approval.json"
                );

            const plan =
                createPlan();

            const expected =
                createApproval(plan);

            await writeApproval(
                path,
                expected
            );

            const actual =
                await readApproval(path);

            assert.deepEqual(
                actual,
                expected
            );

            assert.doesNotThrow(() =>
                validateApprovedPlan(
                    plan,
                    actual
                )
            );
        } finally {
            await rm(
                dir,
                {
                    recursive: true,
                    force: true
                }
            );
        }
    }
);