import test from "node:test";
import assert from "node:assert/strict";

import {
    mkdtemp,
    writeFile,
    rm
} from "node:fs/promises";

import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";

import {
    reconstructExecution
} from "../src/helper/reconstructExecution.js";

import {
    createApproval
} from "../src/execution/createApproval.js";

import {
    writeApproval
} from "../src/execution/writeApproval.js";

import {
    writePlan
} from "../src/planning/writePlan.js";

import type {
    InstallationPlan
} from "../src/planning/types.js";

function sha256(value: string): string {
    return createHash("sha256")
        .update(value)
        .digest("hex");
}

function createPlan(): InstallationPlan {
    return {
        id: "helper-gate-plan",
        createdAt: "2026-08-19T00:00:00Z",

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
                        "Ubuntu:22.04/jammy-updates",
                        "Ubuntu:22.04/jammy-security"
                    ]
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

function createRegistryObject() {
    return {
        version: "0.1.0-dev.0",

        sources: [
            {
                id: "ubuntu.official",
                type: "distribution",
                trust: "core",
                platforms: [
                    "ubuntu"
                ],
                packageManagers: [
                    "apt",
                    "apt-get"
                ]
            }
        ],

        dependencies: [
            {
                id: "audio.alsa.development",
                aliases: [
                    "alsa-dev"
                ],

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

async function createFixture() {
    const dir = await mkdtemp(
        join(
            tmpdir(),
            "outfit-helper-gate-"
        )
    );

    const registryDir =
        join(dir, "registry");

    await import("node:fs/promises").then(
        ({ mkdir }) =>
            mkdir(
                registryDir,
                { recursive: true }
            )
    );

    const registryJson =
        JSON.stringify(
            createRegistryObject(),
            null,
            2
        );

    await writeFile(
        join(
            registryDir,
            "registry.json"
        ),
        registryJson,
        "utf8"
    );

    const release = {
        version: "0.1.0-dev.0",
        schemaVersion: "0.1.0",
        registryFile: "registry.json",

        digest: {
            algorithm: "sha256",
            value: sha256(registryJson)
        },

        signing: {
            required: false
        }
    };

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

    const manifestPath =
        join(dir, "outfit.json");

    await writeFile(
        manifestPath,
        JSON.stringify(
            {
                requires: [
                    "audio.alsa.development"
                ]
            },
            null,
            2
        ),
        "utf8"
    );

    const planPath =
        join(dir, "plan.json");

    const approvalPath =
        join(dir, "approval.json");

    const plan =
        createPlan();

    await writePlan(
        planPath,
        plan
    );

    await writeApproval(
        approvalPath,
        createApproval(plan)
    );

    return {
        dir,
        registryDir,
        manifestPath,
        planPath,
        approvalPath
    };
}

test(
    "valid helper inputs reconstruct execution request",
    async () => {
        const fixture =
            await createFixture();

        try {
            const result =
                await reconstructExecution({
                    manifest:
                    fixture.manifestPath,
                    registry:
                    fixture.registryDir,
                    plan:
                    fixture.planPath,
                    approval:
                    fixture.approvalPath
                });

            assert.equal(
                result.packageManager,
                "apt"
            );

            assert.equal(
                result.operation,
                "install"
            );

            assert.equal(
                result.packages[0].name,
                "libasound2-dev"
            );
        } finally {
            await rm(
                fixture.dir,
                {
                    recursive: true,
                    force: true
                }
            );
        }
    }
);

test(
    "tampered stored plan is rejected by helper",
    async () => {
        const fixture =
            await createFixture();

        try {
            const plan =
                createPlan();

            plan.transaction
                .changes[0]
                .targetVersion =
                "9.9.9-malicious";

            await writePlan(
                fixture.planPath,
                plan
            );

            await assert.rejects(
                () =>
                    reconstructExecution({
                        manifest:
                        fixture.manifestPath,
                        registry:
                        fixture.registryDir,
                        plan:
                        fixture.planPath,
                        approval:
                        fixture.approvalPath
                    }),
                /fingerprint does not match/
            );
        } finally {
            await rm(
                fixture.dir,
                {
                    recursive: true,
                    force: true
                }
            );
        }
    }
);

test(
    "changed manifest is rejected by helper",
    async () => {
        const fixture =
            await createFixture();

        try {
            await writeFile(
                fixture.manifestPath,
                JSON.stringify(
                    {
                        requires: []
                    },
                    null,
                    2
                ),
                "utf8"
            );

            await assert.rejects(
                () =>
                    reconstructExecution({
                        manifest:
                        fixture.manifestPath,
                        registry:
                        fixture.registryDir,
                        plan:
                        fixture.planPath,
                        approval:
                        fixture.approvalPath
                    })
            );
        } finally {
            await rm(
                fixture.dir,
                {
                    recursive: true,
                    force: true
                }
            );
        }
    }
);

test(
    "changed registry mapping is rejected by helper",
    async () => {
        const fixture =
            await createFixture();

        try {
            const changed =
                createRegistryObject();

            changed.dependencies[0]
                .mappings[0]
                .package =
                "libasound2-dev-alt";

            const registryJson =
                JSON.stringify(
                    changed,
                    null,
                    2
                );

            await writeFile(
                join(
                    fixture.registryDir,
                    "registry.json"
                ),
                registryJson,
                "utf8"
            );

            const release = {
                version: "0.1.0-dev.0",
                schemaVersion: "0.1.0",
                registryFile:
                    "registry.json",

                digest: {
                    algorithm: "sha256",
                    value:
                        sha256(registryJson)
                },

                signing: {
                    required: false
                }
            };

            await writeFile(
                join(
                    fixture.registryDir,
                    "registry.release.json"
                ),
                JSON.stringify(
                    release,
                    null,
                    2
                ),
                "utf8"
            );

            await assert.rejects(
                () =>
                    reconstructExecution({
                        manifest:
                        fixture.manifestPath,
                        registry:
                        fixture.registryDir,
                        plan:
                        fixture.planPath,
                        approval:
                        fixture.approvalPath
                    })
            );
        } finally {
            await rm(
                fixture.dir,
                {
                    recursive: true,
                    force: true
                }
            );
        }
    }
);