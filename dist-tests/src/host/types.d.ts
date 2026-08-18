export type OperatingSystem = "linux" | "windows" | "darwin" | "unknown";
export type DistributionFamily = "debian" | "rhel" | "suse" | "arch" | "alpine" | "unknown";
export type PackageManagerName = "apt" | "apt-get" | "dpkg" | "dnf" | "yum" | "rpm" | "zypper" | "pacman" | "apk";
export interface PackageManagerInfo {
    name: PackageManagerName;
    executable: string;
    available: boolean;
    verified: boolean;
    version?: string;
}
export interface LinuxDistribution {
    id: string;
    name?: string;
    version?: string;
    versionId?: string;
    idLike: string[];
    family: DistributionFamily;
}
export interface HostInfo {
    os: OperatingSystem;
    architecture: string;
    distribution?: LinuxDistribution;
    packageManagers: PackageManagerInfo[];
    selectedPackageManager?: PackageManagerName;
}
