import type {
    InstallationPlan
} from "./types.js";

export function validatePlan(
    plan: InstallationPlan
): InstallationPlan {
    if (!plan || typeof plan !== "object") {
        throw new Error(
            "Invalid installation plan"
        );
    }

    if (
        plan.transaction.packageManager !==
        plan.packageManager
    ) {
        throw new Error(
            "Plan transaction package manager does not match plan package manager"
        );
    }

    const resolvedPackages = new Set(
        plan.requirements.map(
            ({ resolution }) =>
                resolution.package
        )
    );

    const requestedPackages = new Set(
        plan.transaction.requestedPackages
    );

    for (const {
        resolution
    } of plan.requirements) {
        if (
            resolution.platform !==
            plan.platform
        ) {
            throw new Error(
                `Resolution '${resolution.canonicalId}' has mismatched platform`
            );
        }

        if (
            resolution.packageManager !==
            plan.packageManager
        ) {
            throw new Error(
                `Resolution '${resolution.canonicalId}' has mismatched package manager`
            );
        }

        if (
            resolution.registryVersion !==
            plan.registryVersion
        ) {
            throw new Error(
                `Resolution '${resolution.canonicalId}' has mismatched registry version`
            );
        }

        if (
            !requestedPackages.has(
                resolution.package
            )
        ) {
            throw new Error(
                `Resolved package '${resolution.package}' is missing from transaction requested packages`
            );
        }
    }

    for (
        const requested
        of requestedPackages
        ) {
        if (!resolvedPackages.has(requested)) {
            throw new Error(
                `Transaction requests package '${requested}' with no dependency resolution`
            );
        }
    }

    for (
        const change
        of plan.transaction.changes
        ) {
        if (
            !requestedPackages.has(
                change.name
            )
        ) {
            throw new Error(
                `Transaction changes unrequested package '${change.name}'`
            );
        }
    }

    return plan;
}