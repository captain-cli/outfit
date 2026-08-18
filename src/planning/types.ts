import type {
  DependencyResolution
} from "../registry/types.js";

import type {
  TransactionPreview
} from "../adapters/packageManager.js";

export interface PlannedRequirement {
  resolution: DependencyResolution;
}

export interface InstallationPlan {
  id: string;

  createdAt: string;

  platform: string;

  packageManager: string;

  registryVersion: string;

  requirements: PlannedRequirement[];

  transaction: TransactionPreview;

  requiresElevation: boolean;
}
