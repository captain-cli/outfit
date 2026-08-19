import type {
    ExecutionRequest
} from "./types.js";

import {
    validateExecutionRequest
} from "./validateExecutionRequest.js";

export interface AptExecutionPreview {
    executable: "/usr/bin/apt-get";
    args: string[];
    executed: false;
}

export function buildAptExecution(
    request: ExecutionRequest
): AptExecutionPreview {
    validateExecutionRequest(
        request
    );

    const args = [
        "install",
        "--yes",
        "--"
    ];

    for (
        const pkg
        of request.packages
        ) {
        /*
         * Pin exact package version when one was approved.
         *
         * Example:
         * libasound2-dev=1.2.6.1-1ubuntu1.2
         */
        args.push(
            pkg.version
                ? `${pkg.name}=${pkg.version}`
                : pkg.name
        );
    }

    return {
        executable:
            "/usr/bin/apt-get",

        args,

        executed: false
    };
}