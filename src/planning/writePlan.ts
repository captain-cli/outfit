import { writeFile } from "node:fs/promises";

import type {
    InstallationPlan
} from "./types.js";

export async function writePlan(
    path: string,
    plan: InstallationPlan
): Promise<void> {
    await writeFile(
        path,
        JSON.stringify(plan, null, 2) + "\n",
        {
            encoding: "utf8",
            mode: 0o600
        }
    );
}