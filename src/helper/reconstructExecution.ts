import { readFile } from "node:fs/promises";

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

export interface HelperInputs {
    manifest: string;
    registry: string;
    plan: string;
    approval: string;
}

export async function reconstructExecution(
    inputs: HelperInputs
): Promise<ExecutionRequest> {
    const approvedPlan =
        await readPlan(inputs.plan);

    const approval =
        await readApproval(inputs.approval);

    const host =
        detectHost();

    const distro =
        host.distribution?.id ?? "unknown";

    const pm =
        host.selectedPackageManager ?? "unknown";

    if (pm !== "apt") {
        throw new Error(
            `Privileged helper does not support '${pm}'`
        );
    }

    const registry =
        await loadRegistry(
            inputs.registry
        );

    const manifest =
        JSON.parse(
            await readFile(
                inputs.manifest,
                "utf8"
            )
        );

    const resolutions = (
        manifest.requires ?? []
    ).map((requirement: string) =>
        resolve(
            registry,
            requirement,
            distro,
            pm
        )
    );

    const adapter =
        new AptAdapter();

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

    const request =
        buildExecutionRequest(
            validation
        );

    return validateExecutionRequest(
        request
    );
}