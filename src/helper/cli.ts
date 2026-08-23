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

import {
    randomUUID
} from "node:crypto";

import {
    writeReceipt
} from "./writeReceipt.js";

import type {
    OperationReceipt
} from "./receipt.js";

import {
    verifyPostExecutionState
} from "./verifyPostExecutionState.js";

import {
    join
} from "node:path";

import type {
    HelperResponse
} from "./response.js";

const RECEIPT_ROOT =
    "/var/lib/captain/outfit/receipts";

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

const receiptId =
    randomUUID();

const receiptPath =
    join(
        RECEIPT_ROOT,
        `${receiptId}.json`
    );

let reconstruction;

try {
    reconstruction =
        await reconstructExecution({
            manifest:
            values.manifest,

            registry:
            values.registry,

            plan:
            values.plan,

            approval:
            values.approval
        });
}
catch (error) {
    const response:
        HelperResponse = {
        status:
            "failed",

        changed:
            false,

        executed:
            false,

        receiptPath:
            null,

        receipt:
            null,

        error: {
            message:
                error instanceof Error
                    ? error.message
                    : String(error)
        }
    };

    console.log(
        JSON.stringify(
            response,
            null,
            2
        )
    );

    process.exit(1);
}

if (
    reconstruction.state ===
    "satisfied"
) {
    const operationReceipt:
        OperationReceipt = {
        receiptVersion: "0.1",

        receiptId:
            receiptId,

        createdAt:
            new Date().toISOString(),

        status: "satisfied",

        planFingerprint:
        reconstruction
            .planFingerprint,

        platform:
        reconstruction
            .currentPlan
            .platform,

        packageManager:
            "apt",

        execution: null,

        verification: null,

        successful: true
    };

    if (values.execute) {
        await writeReceipt(
            receiptPath,
            operationReceipt
        );
    }

    const response:
        HelperResponse = {
        status:
            "satisfied",

        changed:
            false,

        executed:
            false,

        receiptPath,

        receipt:
        operationReceipt
    };

    console.log(
        JSON.stringify(
            response,
            null,
            2
        )
    );

    process.exit(0);
}

if (
    reconstruction.state !==
    "pending"
) {
    throw new Error(
        "Unexpected reconstruction state"
    );
}

const request =
    reconstruction.request;

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
    const execution =
        await executeNative(
            request,
            native
        );

    if (!execution.successful) {
        const operationReceipt:
            OperationReceipt = {
            receiptVersion: "0.1",

            receiptId:
                receiptId,

            createdAt:
                new Date().toISOString(),

            status: "failed",

            request,

            execution,

            verification: null,

            successful: false
        };

        await writeReceipt(
            receiptPath,
            operationReceipt
        );

        const response:
            HelperResponse = {
            status:
                "failed",

            changed:
                true,

            executed:
                true,

            receiptPath,

            receipt:
            operationReceipt
        };

        console.log(
            JSON.stringify(
                response,
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

    const postExecutionState =
        await verifyPostExecutionState({
            manifest: values.manifest,
            registry: values.registry,
            plan: values.plan,
            approval: values.approval
        });

    const successful =
        execution.successful &&
        verification.successful &&
        postExecutionState.state ===
        "satisfied";

    const operationReceipt:
        OperationReceipt = {
        receiptVersion: "0.1",

        receiptId:
            receiptId,

        createdAt:
            new Date().toISOString(),

        status:
            successful
                ? "success"
                : "failed",

        request,

        execution,

        verification,

        postExecutionState,

        successful
    };

    await writeReceipt(
        receiptPath,
        operationReceipt
    );

    const response:
        HelperResponse = {
        status:
            successful
                ? "success"
                : "failed",

        changed:
            true,

        executed:
            true,

        receiptPath,

        receipt:
        operationReceipt
    };

    console.log(
        JSON.stringify(
            response,
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