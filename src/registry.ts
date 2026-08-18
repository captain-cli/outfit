import { readFile } from "node:fs/promises";
import { join } from "node:path";
export interface Mapping { package: string; source: string; }
export interface DependencyEntry { id: string; aliases?: string[]; mappings: Record<string, Record<string, Mapping>>; }
export interface Registry { dependencies: DependencyEntry[]; sources: Array<{id:string; trust:string}>; }
export async function loadRegistry(path: string): Promise<Registry> { return JSON.parse(await readFile(join(path,"registry.json"),"utf8")); }
export function resolve(registry: Registry, requested: string, distro: string, manager: string) {
  const dep=registry.dependencies.find(d=>d.id===requested || d.aliases?.includes(requested));
  if(!dep) throw new Error(`Unknown canonical dependency: ${requested}`);
  const mapping=dep.mappings[distro]?.[manager];
  if(!mapping) throw new Error(`No mapping for ${dep.id} on ${distro}/${manager}`);
  const source=registry.sources.find(s=>s.id===mapping.source);
  if(!source) throw new Error(`Mapping references unregistered source: ${mapping.source}`);
  return { requested, canonical:dep.id, distro, packageManager:manager, package:mapping.package, source:mapping.source, trust:source.trust };
}
