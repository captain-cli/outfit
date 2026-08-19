import type { InstallationPlan } from "../planning/types.js";
import type { ApprovedPlan } from "./types.js";

import { fingerprintPlan } from "../planning/fingerprintPlan.js";
import { validateApprovedPlan } from "./validateApprovedPlan.js";

export interface RevalidationResult {
    approvedPlan: InstallationPlan;
    currentPlan: InstallationPlan;
    approvedFingerprint: string;
    currentFingerprint: string;
    matches: true;
}

export function revalidatePlan(
    approvedPlan: InstallationPlan,
    currentPlan: InstallationPlan,
    approval: ApprovedPlan
): RevalidationResult {
    // First prove the stored plan still matches its approval.
    validateApprovedPlan(
        approvedPlan,
        approval
    );

    const approvedFingerprint =
        fingerprintPlan(approvedPlan);

    const currentFingerprint =
        fingerprintPlan(currentPlan);

    if (
        approvedFingerprint.algorithm !==
        currentFingerprint.algorithm
    ) {
        throw new Error(
            "Current plan fingerprint algorithm does not match approved plan"
        );
    }

    if (
        approvedFingerprint.value !==
        currentFingerprint.value
    ) {
        throw new Error(
            "Current plan does not match approved plan"
        );
    }

    return {
        approvedPlan,
        currentPlan,
        approvedFingerprint:
        approvedFingerprint.value,
        currentFingerprint:
        currentFingerprint.value,
        matches: true
    };
}