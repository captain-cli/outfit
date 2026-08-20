import type {
    ExecutionRequest
} from "./types.js";

import type {
    PostInstallVerification
} from "./verifyInstalled.js";

export interface ExecutionReceipt {
    planFingerprint: {
        algorithm: "sha256";
        value: string;
    };

    executable: string;
    args: string[];

    startedAt: string;
    finishedAt: string;

    exitCode: number | null;

    stdout: string;
    stderr: string;

    successful: boolean;
}

export interface ReceiptBase {
    receiptVersion: "0.1";

    receiptId: string;

    createdAt: string;

    successful: boolean;
}

export interface ExecutedOperationReceipt
    extends ReceiptBase {

    status:
        | "success"
        | "failed";

    request: ExecutionRequest;

    execution:
        ExecutionReceipt;

    verification:
        PostInstallVerification | null;

    postExecutionState?: {
        state: "satisfied";

        planFingerprint: {
            algorithm: "sha256";
            value: string;
        };
    };
}

export interface SatisfiedOperationReceipt
    extends ReceiptBase {

    status: "satisfied";

    planFingerprint: {
        algorithm: "sha256";
        value: string;
    };

    platform: string;

    packageManager: "apt";

    execution: null;

    verification: null;
}

export type OperationReceipt =
    | ExecutedOperationReceipt
    | SatisfiedOperationReceipt;