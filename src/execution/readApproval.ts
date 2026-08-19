import { readFile } from "node:fs/promises";

import type {
    ApprovedPlan
} from "./types.js";

export async function readApproval(
    path: string
): Promise<ApprovedPlan> {
    const raw = await readFile(path, "utf8");

    const parsed = JSON.parse(raw);

    if (
        !parsed ||
        typeof parsed !== "object"
    ) {
        throw new Error(
            "Invalid approval artifact"
        );
    }

    return parsed as ApprovedPlan;
}