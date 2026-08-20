import type {
    RevalidationResult
} from "../execution/revalidatePlan.js";

import type {
    ExecutionRequest
} from "./types.js";

export function buildExecutionRequest(
    validation: RevalidationResult
): ExecutionRequest {
    if (
        validation.state !==
        "matched"
    ) {
        throw new Error(
            "Cannot build execution request for an already satisfied plan"
        );
    }

    const plan =
        validation.currentPlan;

    if (plan.packageManager !== "apt") {
        throw new Error(
            `Unsupported privileged package manager '${plan.packageManager}'`
        );
    }

    const installChanges =
        plan.transaction.changes.filter(
            (change) =>
                change.action === "install"
        );

    if (
        installChanges.length !==
        plan.transaction.changes.length
    ) {
        throw new Error(
            "Privileged helper currently supports install operations only"
        );
    }

    return {
        protocolVersion: "0.1",

        platform:
        plan.platform,

        packageManager:
            "apt",

        operation:
            "install",

        packages:
            installChanges.map(
                (change) => ({
                    name: change.name,
                    version:
                    change.targetVersion,
                    architecture:
                    change.architecture
                })
            ),

        planFingerprint: {
            algorithm: "sha256",
            value:
            validation.currentFingerprint
        }
    };
}