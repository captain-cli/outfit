import type {
    InstallationPlan
} from "../planning/types.js";

import {
    fingerprintPlan
} from "../planning/fingerprintPlan.js";

import type {
    ApprovedPlan
} from "./types.js";

export function validateApprovedPlan(
    plan: InstallationPlan,
    approval: ApprovedPlan
): void {
    if (
        approval.registryVersion !==
        plan.registryVersion
    ) {
        throw new Error(
            "Approved plan registry version does not match current plan"
        );
    }

    if (
        approval.platform !==
        plan.platform
    ) {
        throw new Error(
            "Approved plan platform does not match current plan"
        );
    }

    if (
        approval.packageManager !==
        plan.packageManager
    ) {
        throw new Error(
            "Approved plan package manager does not match current plan"
        );
    }

    const current =
        fingerprintPlan(plan);

    if (
        current.algorithm !==
        approval.fingerprint.algorithm
    ) {
        throw new Error(
            "Approved plan fingerprint algorithm mismatch"
        );
    }

    if (
        current.value !==
        approval.fingerprint.value
    ) {
        throw new Error(
            "Approved plan fingerprint does not match current plan"
        );
    }
}