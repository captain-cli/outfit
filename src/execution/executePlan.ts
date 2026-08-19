import type {
    RevalidationResult
} from "./revalidatePlan.js";

export interface ExecutionResult {
    status: "validated";
    executed: false;
    message: string;
}

export function executePlan(
    validation: RevalidationResult
): ExecutionResult {
    if (!validation.matches) {
        throw new Error(
            "Execution request is not based on a validated plan"
        );
    }

    return {
        status: "validated",
        executed: false,
        message:
            "Approved plan matches current state. Privileged execution remains disabled."
    };
}