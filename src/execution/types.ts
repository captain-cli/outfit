import type {
    PlanFingerprint
} from "../planning/fingerprintPlan.js";

export interface ApprovedPlan {
    planId: string;

    fingerprint: PlanFingerprint;

    approvedAt: string;

    registryVersion: string;

    platform: string;

    packageManager: string;
}