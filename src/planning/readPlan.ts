import { readFile } from "node:fs/promises";

import {
    validatePlan
} from "./validatePlan.js";

import type {
    InstallationPlan
} from "./types.js";

export async function readPlan(
    path: string
): Promise<InstallationPlan> {
    const raw = await readFile(path, "utf8");

    const parsed = JSON.parse(raw);

    if (
        !parsed ||
        typeof parsed !== "object"
    ) {
        throw new Error(
            "Invalid installation plan"
        );
    }

    return validatePlan(
        parsed as InstallationPlan
    );
}