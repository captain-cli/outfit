import type { InstallationPlan } from "./types.js";

function sortObject(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(sortObject);
    }

    if (
        value !== null &&
        typeof value === "object"
    ) {
        const entries = Object.entries(
            value as Record<string, unknown>
        )
            .sort(([a], [b]) =>
                a.localeCompare(b)
            )
            .map(([key, item]) => [
                key,
                sortObject(item)
            ]);

        return Object.fromEntries(entries);
    }

    return value;
}

export function serializePlan(
    plan: InstallationPlan
): string {
    /*
     * Exclude volatile fields from the security fingerprint.
     *
     * id and createdAt change every time the plan is rebuilt,
     * even when the effective transaction is identical.
     *
     * rawOutput is diagnostic text and may contain harmless
     * formatting/order changes from the native package manager.
     */
    const canonical = {
        platform: plan.platform,
        packageManager: plan.packageManager,
        registryVersion: plan.registryVersion,

        requirements: plan.requirements
            .map(({ resolution }) => ({
                requirement: resolution.requirement,
                canonicalId: resolution.canonicalId,
                platform: resolution.platform,
                packageManager: resolution.packageManager,
                package: resolution.package,
                source: resolution.source,
                registryVersion:
                resolution.registryVersion
            }))
            .sort((a, b) =>
                a.canonicalId.localeCompare(
                    b.canonicalId
                )
            ),

        transaction: {
            packageManager:
            plan.transaction.packageManager,

            requestedPackages: [
                ...plan.transaction.requestedPackages
            ].sort(),

            changes: plan.transaction.changes
                .map((change) => ({
                    name: change.name,
                    action: change.action,
                    currentVersion:
                    change.currentVersion,
                    targetVersion:
                    change.targetVersion,
                    architecture:
                    change.architecture,
                    repositoryHints:
                        change.repositoryHints
                            ? [
                                ...change.repositoryHints
                            ].sort()
                            : undefined
                }))
                .sort((a, b) => {
                    const byName =
                        a.name.localeCompare(b.name);

                    if (byName !== 0) {
                        return byName;
                    }

                    return a.action.localeCompare(
                        b.action
                    );
                }),

            requiresElevation:
            plan.transaction.requiresElevation
        },

        requiresElevation:
        plan.requiresElevation
    };

    return JSON.stringify(
        sortObject(canonical)
    );
}