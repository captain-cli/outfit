import type {
    InstallationPlan
} from "../planning/types.js";

import {
    fingerprintPlan
} from "../planning/fingerprintPlan.js";

import type {
    ApprovedPlan
} from "./types.js";

export function createApproval(
    plan: InstallationPlan
): ApprovedPlan {
    return {
        planId: plan.id,

        fingerprint:
            fingerprintPlan(plan),

        approvedAt:
            new Date().toISOString(),

        registryVersion:
        plan.registryVersion,

        platform:
        plan.platform,

        packageManager:
        plan.packageManager
    };
}