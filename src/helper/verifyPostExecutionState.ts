import {
    reconstructExecution
} from "./reconstructExecution.js";

import type {
    HelperInputs,
    ReconstructionDependencies
} from "./reconstructExecution.js";

export interface PostExecutionStateResult {
    state: "satisfied";

    planFingerprint: {
        algorithm: "sha256";
        value: string;
    };
}

export async function verifyPostExecutionState(
    inputs: HelperInputs,
    dependencies?: ReconstructionDependencies
): Promise<PostExecutionStateResult> {
    const reconstruction =
        await reconstructExecution(
            inputs,
            dependencies
        );

    if (
        reconstruction.state !==
        "satisfied"
    ) {
        throw new Error(
            "Post-execution state is not satisfied"
        );
    }

    return {
        state: "satisfied",

        planFingerprint:
        reconstruction.planFingerprint
    };
}