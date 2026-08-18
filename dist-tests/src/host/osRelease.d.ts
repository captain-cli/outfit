import type { DistributionFamily, LinuxDistribution } from "./types.js";
export interface OsReleaseData {
    [key: string]: string;
}
export declare function parseOsRelease(contents: string): OsReleaseData;
export declare function determineDistributionFamily(id: string, idLike: string[]): DistributionFamily;
export declare function detectLinuxDistribution(path?: string): LinuxDistribution;
