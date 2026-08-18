import type { DistributionFamily, PackageManagerInfo, PackageManagerName } from "./types.js";
export declare function detectPackageManagers(): PackageManagerInfo[];
export declare function selectPackageManager(family: DistributionFamily, managers: PackageManagerInfo[]): PackageManagerName | undefined;
