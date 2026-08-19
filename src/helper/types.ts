export type HelperProtocolVersion = "0.1";

export type HelperPackageManager =
    | "apt";

export type HelperOperation =
    | "install";

export interface ExecutionPackage {
    name: string;
    version?: string;
    architecture?: string;
}

export interface ExecutionRequest {
    protocolVersion: HelperProtocolVersion;

    platform: string;

    packageManager: HelperPackageManager;

    operation: HelperOperation;

    packages: ExecutionPackage[];

    planFingerprint: {
        algorithm: "sha256";
        value: string;
    };
}