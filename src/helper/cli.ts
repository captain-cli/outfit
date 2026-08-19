#!/usr/bin/env node

import { parseArgs } from "node:util";

import {
    reconstructExecution
} from "./reconstructExecution.js";

import {
    buildAptExecution
} from "./aptExecutor.js";

import {
    executeNative
} from "./executeNative.js";

import {
    verifyInstalled
} from "./verifyInstalled.js";

const { values } = parseArgs({
    options: {
        manifest: {
            type: "string"
        },

        registry: {
            type: "string"
        },

        plan: {
            type: "string"
        },

        approval: {
            type: "string"
        },

        execute: {
            type: "boolean",
            default: false
        }
    }
});

if (
    !values.manifest ||
    !values.registry ||
    !values.plan ||
    !values.approval
) {
    throw new Error(
        "--manifest, --registry, --plan and --approval are required"
    );
}

const request =
    await reconstructExecution({
        manifest: values.manifest,
        registry: values.registry,
        plan: values.plan,
        approval: values.approval
    });

const native =
    buildAptExecution(
        request
    );

if (process.getuid?.() !== 0 && values.execute) {
    throw new Error(
        "Privileged execution requires root"
    );
}

if (values.execute) {
    const receipt =
        await executeNative(
            request,
            native
        );

    if (!receipt.successful) {
        console.log(
            JSON.stringify(
                {
                    status: "failed",
                    request,
                    receipt,
                    verification: null
                },
                null,
                2
            )
        );

        process.exit(1);
    }

    const verification =
        await verifyInstalled(
            request
        );

    const successful =
        receipt.successful &&
        verification.successful;

    console.log(
        JSON.stringify(
            {
                status:
                    successful
                        ? "success"
                        : "failed",

                request,
                receipt,
                verification
            },
            null,
            2
        )
    );

    process.exit(
        successful
            ? 0
            : 1
    );
}

console.log(
    JSON.stringify(
        {
            status: "validated",
            request,
            native
        },
        null,
        2
    )
);