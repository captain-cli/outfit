export type TransactionAction =
  | "install"
  | "upgrade"
  | "remove"
  | "downgrade"
  | "reinstall";

export interface TransactionPackage {
  name: string;
  action: TransactionAction;
  currentVersion?: string;
  targetVersion?: string;
  architecture?: string;
  repositoryHints?: string[];
}

export interface TransactionPreview {
  packageManager: string;

  requestedPackages: string[];

  changes: TransactionPackage[];

  rawOutput: string;

  requiresElevation: boolean;

  successful: boolean;

  warnings: string[];
}

export interface PackageManagerAdapter {
  readonly name: string;

  previewInstall(
    packages: string[]
  ): Promise<TransactionPreview>;
}
