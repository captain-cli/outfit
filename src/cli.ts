#!/usr/bin/env node
import {readFile} from "node:fs/promises";
import {parseCli, print} from "./cliSupport.js";
import {envelope} from "./protocol.js";
import {detectHost} from "./host/index.js";
import {loadRegistry, resolve} from "./registry/index.js";
import {AptAdapter} from "./adapters/apt.js";
import {DnfAdapter} from "./adapters/dnf.js";
import type {PackageManagerAdapter} from "./adapters/packageManager.js";
import {buildInstallationPlan} from "./planning/buildPlan.js";
import {readPlan} from "./planning/readPlan.js";
import {writePlan} from "./planning/writePlan.js";
import {createApproval} from "./execution/createApproval.js";
import {writeApproval} from "./execution/writeApproval.js";
import { readApproval } from "./execution/readApproval.js";
import { revalidatePlan } from "./execution/revalidatePlan.js";
import { executePlan } from "./execution/executePlan.js";

const {values, positionals} = parseCli();
const op = positionals[0] ?? "help";
if (values.version) {
    console.log("0.1.0-dev.0");
    process.exit(0);
}
if (values.help || op === "help") {
    console.log(
        `outfit detect|host|plan|approve|apply

plan:
  --manifest <file>
  --registry <dir>
  [--output <plan-file>]

approve:
  --plan <plan-file>
  --output <approval-file>

apply:
  --manifest <file>
  --registry <dir>
  --plan <plan-file>
  --approval <approval-file>

common:
  --json

Privileged package installation is currently disabled.`
    );

    process.exit(0);
}
if (op === "detect") {
    const host = await detectHost();
    print(envelope("outfit", "detect", "success", host), values.json);
    process.exit(0);
}

if (op === "host") {
    const host = detectHost();

    print(
        envelope(
            "outfit",
            "host",
            "success",
            {host}
        ),
        values.json
    );

    process.exit(0);
}

if (op === "plan") {
    const host = detectHost();

    if (!values.manifest || !values.registry) {
        throw new Error(
            "--manifest and --registry are required"
        );
    }

    const manifest = JSON.parse(
        await readFile(values.manifest, "utf8")
    );

    const reg = await loadRegistry(values.registry);

    const distro =
        host.distribution?.id ?? "unknown";

    const pm =
        host.selectedPackageManager ?? "unknown";

    const resolutions = (
        manifest.requires ?? []
    ).map((requirement: string) =>
        resolve(
            reg,
            requirement,
            distro,
            pm
        )
    );

    let adapter: PackageManagerAdapter;

    switch (pm) {
        case "apt":
        case "apt-get":
            adapter = new AptAdapter();
            break;

        case "dnf":
            adapter = new DnfAdapter();
            break;

        default:
            throw new Error(
                `No transaction preview adapter available for package manager '${pm}'`
            );
    }

    const plan = await buildInstallationPlan(
        resolutions,
        adapter
    );

    if (values.output) {
        await writePlan(
            values.output,
            plan
        );
    }

    print(
        envelope(
            "outfit",
            "plan",
            "success",
            {
                host,
                plan,
                artifact: values.output
                    ? {
                        type: "installation-plan",
                        path: values.output
                    }
                    : undefined
            }
        ),
        values.json
    );

    process.exit(0);
}

if (op === "approve") {
    if (!values.plan) {
        throw new Error(
            "--plan is required"
        );
    }

    if (!values.output) {
        throw new Error(
            "--output is required"
        );
    }

    const plan = await readPlan(
        values.plan
    );

    const approval =
        createApproval(plan);

    await writeApproval(
        values.output,
        approval
    );

    print(
        envelope(
            "outfit",
            "approve",
            "success",
            {
                approval,
                artifact: {
                    type: "plan-approval",
                    path: values.output
                }
            }
        ),
        values.json
    );

    process.exit(0);
}

if (op === "apply") {
    if (
        !values.manifest ||
        !values.registry ||
        !values.plan ||
        !values.approval
    ) {
        throw new Error(
            "--manifest, --registry, --plan and --approval are required"
        );
    }

    /*
     * Load the artifacts first.
     *
     * Neither artifact is trusted merely because it exists.
     * revalidatePlan() will prove that the stored plan matches
     * its approval and that the freshly reconstructed plan still
     * represents the same effective transaction.
     */
    const approvedPlan =
        await readPlan(values.plan);

    const approval =
        await readApproval(values.approval);

    /*
     * Re-detect the host instead of trusting host information
     * captured during the original planning operation.
     */
    const host = detectHost();

    const distro =
        host.distribution?.id ?? "unknown";

    const pm =
        host.selectedPackageManager ?? "unknown";

    /*
     * Reload and verify the registry.
     *
     * loadRegistry() performs the registry release-integrity
     * checks before resolution is allowed.
     */
    const reg =
        await loadRegistry(values.registry);

    /*
     * Reload the manifest rather than deriving requirements
     * from the stored plan.
     */
    const manifest = JSON.parse(
        await readFile(
            values.manifest,
            "utf8"
        )
    );

    const resolutions = (
        manifest.requires ?? []
    ).map((requirement: string) =>
        resolve(
            reg,
            requirement,
            distro,
            pm
        )
    );

    /*
     * Select a fresh package-manager adapter.
     *
     * The adapter performs another native transaction preview,
     * giving us current package-manager state.
     */
    let adapter: PackageManagerAdapter;

    switch (pm) {
        case "apt":
        case "apt-get":
            adapter =
                new AptAdapter();
            break;

        case "dnf":
            adapter =
                new DnfAdapter();
            break;

        default:
            throw new Error(
                `No transaction preview adapter available for package manager '${pm}'`
            );
    }

    /*
     * This is intentionally a NEW plan.
     *
     * Its id and createdAt will differ from the approved artifact,
     * but those volatile properties are excluded from the
     * canonical security fingerprint.
     */
    const currentPlan =
        await buildInstallationPlan(
            resolutions,
            adapter
        );

    /*
     * Security gate:
     *
     * 1. approval must match stored approved plan
     * 2. stored approved plan must match freshly rebuilt plan
     */
    const validation =
        revalidatePlan(
            approvedPlan,
            currentPlan,
            approval
        );

    /*
     * executePlan currently represents the execution boundary.
     * It MUST NOT perform privileged package installation yet.
     */
    const execution =
        executePlan(validation);

    print(
        envelope(
            "outfit",
            "apply",
            "success",
            {
                host,

                validation: {
                    matches:
                    validation.matches,

                    approvedFingerprint:
                    validation.approvedFingerprint,

                    currentFingerprint:
                    validation.currentFingerprint
                },

                execution
            }
        ),
        values.json
    );

    process.exit(0);
}

throw new Error(`Unknown command: ${op}`);
