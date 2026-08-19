import { writeFile } from "node:fs/promises";

import type {
    ApprovedPlan
} from "./types.js";

export async function writeApproval(
    path: string,
    approval: ApprovedPlan
): Promise<void> {
    await writeFile(
        path,
        JSON.stringify(
            approval,
            null,
            2
        ) + "\n",
        {
            encoding: "utf8",
            mode: 0o600
        }
    );
}