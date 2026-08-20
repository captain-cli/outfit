import test from "node:test";
import assert from "node:assert/strict";

import {
    mkdtemp,
    mkdir,
    writeFile,
    rm
} from "node:fs/promises";

import {
    tmpdir
} from "node:os";

import {
    join
} from "node:path";

import {
    createHash
} from "node:crypto";

import {
    createApproval
} from "../src/execution/createApproval.js";

import {
    writeApproval
} from "../src/execution/writeApproval.js";

import {
    writePlan
} from "../src/planning/writePlan.js";

import {
    verifyPostExecutionState
} from "../src/helper/verifyPostExecutionState.js";

import type {
    InstallationPlan
} from "../src/planning/types.js";

import type {
    PackageManagerAdapter
} from "../src/adapters/packageManager.js";

function sha256(
    value: string
): string {
    return createHash("sha256")
        .update(value)
        .digest("hex");
}

function createPlan():
    InstallationPlan {
    return {
        id: "post-execution-test",

        createdAt:
            "2026-08-20T00:00:00Z",

        platform:
            "ubuntu",

        packageManager:
            "apt",

        registryVersion:
            "0.1.0-dev.0",

        requirements: [
            {
                resolution: {
                    requirement:
                        "audio.alsa.development",

                    canonicalId:
                        "audio.alsa.development",

                    platform:
                        "ubuntu",

                    packageManager:
                        "apt",

                    package:
                        "libasound2-dev",

                    source:
                        "ubuntu.official",

                    registryVersion:
                        "0.1.0-dev.0"
                }
            }
        ],

        transaction: {
            packageManager:
                "apt",

            requestedPackages: [
                "libasound2-dev"
            ],

            changes: [
                {
                    name:
                        "libasound2-dev",

                    action:
                        "install",

                    targetVersion:
                        "1.2.6.1-1ubuntu1.2",

                    architecture:
                        "amd64"
                }
            ],

            rawOutput: "",

            requiresElevation:
                true,

            successful:
                true,

            warnings: []
        },

        requiresElevation:
            true
    };
}

async function createFixture() {
    const dir =
        await mkdtemp(
            join(
                tmpdir(),
                "outfit-post-exec-"
            )
        );

    const registryDir =
        join(
            dir,
            "registry"
        );

    await mkdir(
        registryDir,
        {
            recursive: true
        }
    );

    const registry = {
        version:
            "0.1.0-dev.0",

        sources: [
            {
                id:
                    "ubuntu.official",

                type:
                    "distribution",

                trust:
                    "core",

                platforms: [
                    "ubuntu"
                ],

                packageManagers: [
                    "apt"
                ]
            }
        ],

        dependencies: [
            {
                id:
                    "audio.alsa.development",

                mappings: [
                    {
                        platform:
                            "ubuntu",

                        packageManager:
                            "apt",

                        package:
                            "libasound2-dev",

                        source:
                            "ubuntu.official"
                    }
                ]
            }
        ]
    };

    const registryJson =
        JSON.stringify(
            registry,
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

    await writeFile(
        join(
            registryDir,
            "registry.release.json"
        ),
        JSON.stringify(
            {
                version:
                    "0.1.0-dev.0",

                schemaVersion:
                    "0.1.0",

                registryFile:
                    "registry.json",

                digest: {
                    algorithm:
                        "sha256",

                    value:
                        sha256(
                            registryJson
                        )
                },

                signing: {
                    required:
                        false
                }
            },
            null,
            2
        ),
        "utf8"
    );

    const manifestPath =
        join(
            dir,
            "outfit.json"
        );

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

    const plan =
        createPlan();

    const planPath =
        join(
            dir,
            "plan.json"
        );

    const approvalPath =
        join(
            dir,
            "approval.json"
        );

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

const fakeHost = () => ({
    os: "linux" as const,

    architecture:
        "x64",

    distribution: {
        id:
            "ubuntu",

        name:
            "Ubuntu",

        version:
            "22.04",

        versionId:
            "22.04",

        idLike: [
            "debian"
        ],

        family:
            "debian" as const
    },

    packageManagers: [],

    selectedPackageManager:
        "apt" as const
});

test(
    "post-execution verification requires satisfied state",
    async () => {
        const fixture =
            await createFixture();

        const satisfiedAdapter:
            PackageManagerAdapter = {
            name:
                "apt",

            async previewInstall(
                packages
            ) {
                return {
                    packageManager:
                        "apt",

                    requestedPackages:
                    packages,

                    changes: [],

                    rawOutput:
                        "already satisfied",

                    requiresElevation:
                        false,

                    successful:
                        true,

                    warnings: []
                };
            }
        };

        try {
            const result =
                await verifyPostExecutionState(
                    {
                        manifest:
                        fixture.manifestPath,

                        registry:
                        fixture.registryDir,

                        plan:
                        fixture.planPath,

                        approval:
                        fixture.approvalPath
                    },
                    {
                        detectHost:
                        fakeHost,

                        createAdapter:
                            () =>
                                satisfiedAdapter
                    }
                );

            assert.equal(
                result.state,
                "satisfied"
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