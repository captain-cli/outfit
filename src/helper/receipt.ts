export interface ExecutionReceipt {
    planFingerprint: {
        algorithm: "sha256";
        value: string;
    };

    executable: string;
    args: string[];

    startedAt: string;
    finishedAt: string;

    exitCode: number | null;

    stdout: string;
    stderr: string;

    successful: boolean;
}