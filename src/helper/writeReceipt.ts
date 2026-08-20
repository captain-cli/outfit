import {
    chmod,
    mkdir,
    rename,
    writeFile
} from "node:fs/promises";

import {
    dirname
} from "node:path";

import {
    randomUUID
} from "node:crypto";

import type {
    OperationReceipt
} from "./receipt.js";

export async function writeReceipt(
    path: string,
    receipt: OperationReceipt
): Promise<void> {
    const directory =
        dirname(path);

    await mkdir(
        directory,
        {
            recursive: true,
            mode: 0o700
        }
    );

    const temporaryPath =
        `${path}.${randomUUID()}.tmp`;

    const data =
        JSON.stringify(
            receipt,
            null,
            2
        ) + "\n";

    try {
        await writeFile(
            temporaryPath,
            data,
            {
                encoding: "utf8",
                mode: 0o600,
                flag: "wx"
            }
        );

        await chmod(
            temporaryPath,
            0o600
        );

        await rename(
            temporaryPath,
            path
        );

        await chmod(
            path,
            0o600
        );
    } catch (error) {
        throw new Error(
            `Unable to persist execution receipt: ${
                error instanceof Error
                    ? error.message
                    : String(error)
            }`
        );
    }
}