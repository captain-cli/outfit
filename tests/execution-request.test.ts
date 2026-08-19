import test from "node:test";
import assert from "node:assert/strict";

import {
    validateExecutionRequest
} from "../src/helper/validateExecutionRequest.js";

import type {
    ExecutionRequest
} from "../src/helper/types.js";

function request(): ExecutionRequest {
    return {
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
            algorithm: "sha256",
            value: "a".repeat(64)
        }
    };
}

test(
    "valid execution request passes",
    () => {
        assert.doesNotThrow(() =>
            validateExecutionRequest(
                request()
            )
        );
    }
);

test(
    "rejects package name containing shell syntax",
    () => {
        const bad = request();

        bad.packages[0].name =
            "libfoo;rm";

        assert.throws(
            () =>
                validateExecutionRequest(
                    bad
                ),
            /Unsafe package name/
        );
    }
);

test(
    "rejects invalid plan fingerprint",
    () => {
        const bad = request();

        bad.planFingerprint.value =
            "not-a-hash";

        assert.throws(
            () =>
                validateExecutionRequest(
                    bad
                ),
            /Invalid plan fingerprint/
        );
    }
);

test(
    "rejects empty execution request",
    () => {
        const bad = request();

        bad.packages = [];

        assert.throws(
            () =>
                validateExecutionRequest(
                    bad
                ),
            /contains no package changes/
        );
    }
);