import type {
    ExecutionRequest
} from "./types.js";

const SAFE_PACKAGE_NAME =
    /^[a-zA-Z0-9][a-zA-Z0-9+_.:-]*$/;

const SAFE_VERSION =
    /^[a-zA-Z0-9][a-zA-Z0-9+_.:~\-]*$/;

const SAFE_ARCH =
    /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

export function validateExecutionRequest(
    request: ExecutionRequest
): ExecutionRequest {
    if (
        request.protocolVersion !== "0.1"
    ) {
        throw new Error(
            "Unsupported helper protocol version"
        );
    }

    if (
        request.packageManager !== "apt"
    ) {
        throw new Error(
            "Unsupported helper package manager"
        );
    }

    if (
        request.operation !== "install"
    ) {
        throw new Error(
            "Unsupported helper operation"
        );
    }

    if (
        !Array.isArray(request.packages)
    ) {
        throw new Error(
            "Execution request packages must be an array"
        );
    }

    if (
        request.packages.length === 0
    ) {
        throw new Error(
            "Execution request contains no package changes"
        );
    }

    for (
        const pkg
        of request.packages
        ) {
        if (
            typeof pkg.name !== "string" ||
            !SAFE_PACKAGE_NAME.test(
                pkg.name
            )
        ) {
            throw new Error(
                `Unsafe package name '${pkg.name}'`
            );
        }

        if (
            pkg.version !== undefined &&
            !SAFE_VERSION.test(
                pkg.version
            )
        ) {
            throw new Error(
                `Unsafe package version '${pkg.version}'`
            );
        }

        if (
            pkg.architecture !== undefined &&
            !SAFE_ARCH.test(
                pkg.architecture
            )
        ) {
            throw new Error(
                `Unsafe package architecture '${pkg.architecture}'`
            );
        }
    }

    if (
        request.planFingerprint
            ?.algorithm !== "sha256"
    ) {
        throw new Error(
            "Unsupported or missing plan fingerprint"
        );
    }

    if (
        !/^[a-f0-9]{64}$/i.test(
            request.planFingerprint.value
        )
    ) {
        throw new Error(
            "Invalid plan fingerprint value"
        );
    }

    return request;
}