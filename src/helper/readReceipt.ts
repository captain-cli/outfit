import {
    readFile
} from "node:fs/promises";

import type {
    OperationReceipt
} from "./receipt.js";

export async function readReceipt(
    path: string
): Promise<OperationReceipt> {
    const raw =
        await readFile(
            path,
            "utf8"
        );

    let parsed: unknown;

    try {
        parsed =
            JSON.parse(raw);
    } catch (error) {
        throw new Error(
            `Unable to parse execution receipt: ${
                error instanceof Error
                    ? error.message
                    : String(error)
            }`
        );
    }

    if (
        !parsed ||
        typeof parsed !== "object"
    ) {
        throw new Error(
            "Invalid execution receipt"
        );
    }

    return parsed as OperationReceipt;
}