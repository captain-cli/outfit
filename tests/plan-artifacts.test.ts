import test from "node:test";
import assert from "node:assert/strict";

import {
    mkdtemp,
    rm
} from "node:fs/promises";

import { tmpdir } from "node:os";
import { join } from "node:path";

import {
    readPlan
} from "../src/planning/readPlan.js";

import {
    writePlan
} from "../src/planning/writePlan.js";

import type {
    InstallationPlan
} from "../src/planning/types.js";

function createPlan(): InstallationPlan {
    return {
        id: "artifact-test",
        createdAt:
            "2026-08-18T00:00:00Z",

        platform: "ubuntu",
        packageManager: "apt",
        registryVersion:
            "0.1.0-dev.0",

        requirements: [],

        transaction: {
            packageManager: "apt",
            requestedPackages: [],
            changes: [],
            rawOutput: "",
            requiresElevation: false,
            successful: true,
            warnings: []
        },

        requiresElevation: false
    };
}

test(
    "plan artifact round trips",
    async () => {
        const dir = await mkdtemp(
            join(tmpdir(), "outfit-plan-")
        );

        try {
            const path =
                join(dir, "plan.json");

            const expected =
                createPlan();

            await writePlan(
                path,
                expected
            );

            const actual =
                await readPlan(path);

            assert.deepEqual(
                actual,
                expected
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