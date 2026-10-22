import {loadOutfitRequirements} from "../manifestRequirements.js";

import { detectHost } from "../host/index.js";
import { loadRegistry, resolve } from "../registry/index.js";

import { AptAdapter } from "../adapters/apt.js";

import {
    buildInstallationPlan
} from "../planning/buildPlan.js";

import {
    readPlan
} from "../planning/readPlan.js";

import {
    readApproval
} from "../execution/readApproval.js";

import {
    revalidatePlan
} from "../execution/revalidatePlan.js";

import {
    buildExecutionRequest
} from "./buildExecutionRequest.js";

import {
    validateExecutionRequest
} from "./validateExecutionRequest.js";

import type {
    ExecutionRequest
} from "./types.js";

import type {
    PackageManagerAdapter
} from "../adapters/packageManager.js";

import type {
    InstallationPlan
} from "../planning/types.js";

export interface ReconstructionDependencies {
    detectHost: typeof detectHost;

    createAdapter: (
        packageManager: string
    ) => PackageManagerAdapter;

    loadRegistry:
        typeof loadRegistry;
}

export interface HelperInputs {
    manifest: string;
    registry: string;
    plan: string;
    approval: string;
}

const DEFAULT_DEPENDENCIES:
    ReconstructionDependencies = {
    detectHost,
    loadRegistry,

    createAdapter(
        packageManager: string
    ) {
        if (
            packageManager === "apt" ||
            packageManager === "apt-get"
        ) {
            return new AptAdapter();
        }

        throw new Error(
            `Privileged helper does not support '${packageManager}'`
        );
    }
};

export async function reconstructExecution(
    inputs: HelperInputs,
    dependencies:
    ReconstructionDependencies =
    DEFAULT_DEPENDENCIES
): Promise<ReconstructionResult> {
    const approvedPlan =
        await readPlan(inputs.plan);

    const approval =
        await readApproval(inputs.approval);

    const host =
        dependencies.detectHost();

    const distro =
        host.distribution?.id ?? "unknown";

    const pm =
        host.selectedPackageManager ?? "unknown";

    const registry =
        await dependencies.loadRegistry(
            inputs.registry
        );

    const requires = await loadOutfitRequirements(inputs.manifest);

    const resolutions = (
        requires
    ).map((requirement: string) =>
        resolve(
            registry,
            requirement,
            distro,
            pm
        )
    );

    const adapter =
        dependencies.createAdapter(
            pm
        );

    const currentPlan =
        await buildInstallationPlan(
            resolutions,
            adapter
        );

    const validation =
        revalidatePlan(
            approvedPlan,
            currentPlan,
            approval
        );

    if (
        validation.state ===
        "satisfied"
    ) {
        return {
            state: "satisfied",

            approvedPlan:
            validation.approvedPlan,

            currentPlan:
            validation.currentPlan,

            planFingerprint: {
                algorithm: "sha256",
                value:
                validation
                    .approvedFingerprint
            }
        };
    }

    const request =
        buildExecutionRequest(
            validation
        );

    return {
        state: "pending",

        request:
            validateExecutionRequest(
                request
            )
    };
}

export interface SatisfiedExecution {
    state: "satisfied";

    approvedPlan: InstallationPlan;
    currentPlan: InstallationPlan;

    planFingerprint: {
        algorithm: "sha256";
        value: string;
    };
}

export interface PendingExecution {
    state: "pending";
    request: ExecutionRequest;
}

export type ReconstructionResult =
    | SatisfiedExecution
    | PendingExecution;