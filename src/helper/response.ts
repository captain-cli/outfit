import type {
    OperationReceipt
} from "./receipt.js";

export type HelperResponseStatus =
    | "success"
    | "failed"
    | "satisfied";

export interface HelperResponseError {
    message: string;
}

export interface HelperResponse {
    status:
        HelperResponseStatus;

    changed:
        boolean;

    executed:
        boolean;

    receiptPath:
        string | null;

    receipt:
        OperationReceipt | null;

    error?:
        HelperResponseError;
}