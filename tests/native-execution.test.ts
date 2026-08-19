import test from "node:test";
import assert from "node:assert/strict";

import {
    executeNative
} from "../src/helper/executeNative.js";

import type {
    ExecutionRequest
} from "../src/helper/types.js";

test(
    "rejects unexpected native executable",
    async () => {
        const request:
            ExecutionRequest = {
            protocolVersion: "0.1",
            platform: "ubuntu",
            packageManager: "apt",
            operation: "install",

            packages: [
                {
                    name:
                        "libasound2-dev",
                    version:
                        "1.2.6.1-1ubuntu1.2"
                }
            ],

            planFingerprint: {
                algorithm: "sha256",
                value: "a".repeat(64)
            }
        };

        await assert.rejects(
            () =>
                executeNative(
                    request,
                    {
                        executable:
                            "/bin/bash" as "/usr/bin/apt-get",

                        args: [
                            "-c",
                            "echo nope"
                        ],

                        executed: false
                    }
                ),
            /unexpected executable/
        );
    }
);