import { readFile } from "node:fs/promises";
import { join } from "node:path";
export async function loadRegistry(path) { return JSON.parse(await readFile(join(path, "registry.json"), "utf8")); }
export function resolve(registry, requested, distro, manager) {
    const dep = registry.dependencies.find(d => d.id === requested || d.aliases?.includes(requested));
    if (!dep)
        throw new Error(`Unknown canonical dependency: ${requested}`);
    const mapping = dep.mappings[distro]?.[manager];
    if (!mapping)
        throw new Error(`No mapping for ${dep.id} on ${distro}/${manager}`);
    const source = registry.sources.find(s => s.id === mapping.source);
    if (!source)
        throw new Error(`Mapping references unregistered source: ${mapping.source}`);
    return { requested, canonical: dep.id, distro, packageManager: manager, package: mapping.package, source: mapping.source, trust: source.trust };
}
//# sourceMappingURL=registry.js.map