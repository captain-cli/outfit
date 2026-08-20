import type { InstallationPlan } from "../planning/types.js";
import type { ApprovedPlan } from "./types.js";

import { fingerprintPlan } from "../planning/fingerprintPlan.js";
import { validateApprovedPlan } from "./validateApprovedPlan.js";

export interface MatchedRevalidationResult {
    state: "matched";
    matches: true;

    approvedPlan: InstallationPlan;
    currentPlan: InstallationPlan;

    approvedFingerprint: string;
    currentFingerprint: string;
}

export interface SatisfiedRevalidationResult {
    state: "satisfied";
    matches: false;

    approvedPlan: InstallationPlan;
    currentPlan: InstallationPlan;

    approvedFingerprint: string;
    currentFingerprint: string;
}

export type RevalidationResult =
    | MatchedRevalidationResult
    | SatisfiedRevalidationResult;

export function revalidatePlan(
    approvedPlan: InstallationPlan,
    currentPlan: InstallationPlan,
    approval: ApprovedPlan
): RevalidationResult {
    /*
     * First prove that the stored plan itself
     * is still exactly what was approved.
     */
    validateApprovedPlan(
        approvedPlan,
        approval
    );

    const approvedFingerprint =
        fingerprintPlan(
            approvedPlan
        );

    const currentFingerprint =
        fingerprintPlan(
            currentPlan
        );

    if (
        approvedFingerprint.algorithm !==
        currentFingerprint.algorithm
    ) {
        throw new Error(
            "Current plan fingerprint algorithm does not match approved plan"
        );
    }

    /*
     * Exact same effective transaction.
     */
    if (
        approvedFingerprint.value ===
        currentFingerprint.value
    ) {
        return {
            state: "matched",
            matches: true,

            approvedPlan,
            currentPlan,

            approvedFingerprint:
            approvedFingerprint.value,

            currentFingerprint:
            currentFingerprint.value
        };
    }

    /*
     * The transaction may legitimately disappear
     * after the approved operation has already
     * brought the host into the desired state.
     */
    if (
        currentPlan.transaction
            .changes.length === 0 &&
        sameDesiredState(
            approvedPlan,
            currentPlan
        )
    ) {
        return {
            state: "satisfied",
            matches: false,

            approvedPlan,
            currentPlan,

            approvedFingerprint:
            approvedFingerprint.value,

            currentFingerprint:
            currentFingerprint.value
        };
    }

    throw new Error(
        "Current plan does not match approved plan"
    );
}

function sameDesiredState(
    approved: InstallationPlan,
    current: InstallationPlan
): boolean {
    if (
        approved.platform !==
        current.platform
    ) {
        return false;
    }

    if (
        approved.packageManager !==
        current.packageManager
    ) {
        return false;
    }

    if (
        approved.registryVersion !==
        current.registryVersion
    ) {
        return false;
    }

    const approvedRequirements =
        approved.requirements
            .map(({ resolution }) => ({
                requirement:
                resolution.requirement,

                canonicalId:
                resolution.canonicalId,

                platform:
                resolution.platform,

                packageManager:
                resolution.packageManager,

                package:
                resolution.package,

                source:
                resolution.source,

                registryVersion:
                resolution.registryVersion
            }))
            .sort(
                (a, b) =>
                    a.canonicalId.localeCompare(
                        b.canonicalId
                    )
            );

    const currentRequirements =
        current.requirements
            .map(({ resolution }) => ({
                requirement:
                resolution.requirement,

                canonicalId:
                resolution.canonicalId,

                platform:
                resolution.platform,

                packageManager:
                resolution.packageManager,

                package:
                resolution.package,

                source:
                resolution.source,

                registryVersion:
                resolution.registryVersion
            }))
            .sort(
                (a, b) =>
                    a.canonicalId.localeCompare(
                        b.canonicalId
                    )
            );

    return (
        JSON.stringify(
            approvedRequirements
        ) ===
        JSON.stringify(
            currentRequirements
        )
    );
}