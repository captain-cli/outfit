import test from "node:test";
import assert from "node:assert/strict";

import {
    mkdtemp,
    rm,
    stat
} from "node:fs/promises";

import {
    tmpdir
} from "node:os";

import {
    join
} from "node:path";

import {
    writeReceipt
} from "../src/helper/writeReceipt.js";

import {
    readReceipt
} from "../src/helper/readReceipt.js";

import type {
    OperationReceipt
} from "../src/helper/receipt.js";

function createReceipt():
    OperationReceipt {
    return {
        receiptVersion: "0.1",

        receiptId:
            "receipt-test",

        createdAt:
            "2026-08-19T00:00:00Z",

        status: "success",

        request: {
            protocolVersion: "0.1",
            platform: "ubuntu",
            packageManager: "apt",
            operation: "install",

            packages: [
                {
                    name:
                        "libasound2-dev",

                    version:
                        "1.2.6.1-1ubuntu1.2",

                    architecture:
                        "amd64"
                }
            ],

            planFingerprint: {
                algorithm:
                    "sha256",

                value:
                    "a".repeat(64)
            }
        },

        execution: {
            planFingerprint: {
                algorithm:
                    "sha256",

                value:
                    "a".repeat(64)
            },

            executable:
                "/usr/bin/apt-get",

            args: [
                "install",
                "--yes",
                "--",
                "libasound2-dev=1.2.6.1-1ubuntu1.2"
            ],

            startedAt:
                "2026-08-19T00:00:00Z",

            finishedAt:
                "2026-08-19T00:00:01Z",

            exitCode: 0,

            stdout: "",
            stderr: "",

            successful: true
        },

        verification: {
            successful: true,

            packages: [
                {
                    name:
                        "libasound2-dev",

                    expectedVersion:
                        "1.2.6.1-1ubuntu1.2",

                    installedVersion:
                        "1.2.6.1-1ubuntu1.2",

                    installed: true,

                    versionMatches: true
                }
            ]
        },

        successful: true
    };
}

test(
    "execution receipt round trips",
    async () => {
        const directory =
            await mkdtemp(
                join(
                    tmpdir(),
                    "outfit-receipt-"
                )
            );

        try {
            const path =
                join(
                    directory,
                    "receipt.json"
                );

            const expected =
                createReceipt();

            await writeReceipt(
                path,
                expected
            );

            const actual =
                await readReceipt(
                    path
                );

            assert.deepEqual(
                actual,
                expected
            );
        } finally {
            await rm(
                directory,
                {
                    recursive: true,
                    force: true
                }
            );
        }
    }
);

test(
    "execution receipt is written with private permissions",
    async () => {
        const directory =
            await mkdtemp(
                join(
                    tmpdir(),
                    "outfit-receipt-"
                )
            );

        try {
            const path =
                join(
                    directory,
                    "receipt.json"
                );

            await writeReceipt(
                path,
                createReceipt()
            );

            const info =
                await stat(path);

            assert.equal(
                info.mode & 0o777,
                0o600
            );
        } finally {
            await rm(
                directory,
                {
                    recursive: true,
                    force: true
                }
            );
        }
    }
);

test(
    "satisfied receipt round trips without execution request",
    async () => {
        const directory =
            await mkdtemp(
                join(
                    tmpdir(),
                    "outfit-receipt-"
                )
            );

        try {
            const path =
                join(
                    directory,
                    "satisfied.json"
                );

            const receipt:
                OperationReceipt = {
                receiptVersion: "0.1",

                receiptId:
                    "satisfied-test",

                createdAt:
                    "2026-08-20T00:00:00Z",

                status:
                    "satisfied",

                planFingerprint: {
                    algorithm:
                        "sha256",

                    value:
                        "a".repeat(64)
                },

                platform:
                    "ubuntu",

                packageManager:
                    "apt",

                execution: null,

                verification: null,

                successful: true
            };

            await writeReceipt(
                path,
                receipt
            );

            const actual =
                await readReceipt(
                    path
                );

            assert.deepEqual(
                actual,
                receipt
            );

            assert.equal(
                "request" in actual,
                false
            );
        } finally {
            await rm(
                directory,
                {
                    recursive: true,
                    force: true
                }
            );
        }
    }
);