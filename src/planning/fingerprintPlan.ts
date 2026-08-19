import { createHash } from "node:crypto";

import type {
    InstallationPlan
} from "./types.js";

import {
    serializePlan
} from "./serializePlan.js";

export interface PlanFingerprint {
    algorithm: "sha256";
    value: string;
}

export function fingerprintPlan(
    plan: InstallationPlan
): PlanFingerprint {
    const serialized = serializePlan(plan);

    const value = createHash("sha256")
        .update(serialized, "utf8")
        .digest("hex");

    return {
        algorithm: "sha256",
        value
    };
}