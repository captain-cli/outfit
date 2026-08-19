import test from "node:test";
import assert from "node:assert/strict";

import {
    verifyInstalled
} from "../src/helper/verifyInstalled.js";

import type {
    ExecutionRequest
} from "../src/helper/types.js";

test(
    "post-install verification rejects unsupported package manager",
    async () => {
        const request = {
            protocolVersion: "0.1",
            platform: "fedora",
            packageManager: "dnf",
            operation: "install",
            packages: [
                {
                    name: "example"
                }
            ],
            planFingerprint: {
                algorithm: "sha256",
                value: "a".repeat(64)
            }
        } as unknown as ExecutionRequest;

        await assert.rejects(
            () => verifyInstalled(request),
            /does not support/
        );
    }
);