export interface Mapping {
    package: string;
    source: string;
}
export interface DependencyEntry {
    id: string;
    aliases?: string[];
    mappings: Record<string, Record<string, Mapping>>;
}
export interface Registry {
    dependencies: DependencyEntry[];
    sources: Array<{
        id: string;
        trust: string;
    }>;
}
export declare function loadRegistry(path: string): Promise<Registry>;
export declare function resolve(registry: Registry, requested: string, distro: string, manager: string): {
    requested: string;
    canonical: string;
    distro: string;
    packageManager: string;
    package: string;
    source: string;
    trust: string;
};
