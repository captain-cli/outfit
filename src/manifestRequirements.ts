import path from "node:path";
import fs from "node:fs/promises";

interface JsonObject { [key: string]: unknown }
function object(value: unknown, label: string): JsonObject {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error(`${label} must be an object`);
    }
    return value as JsonObject;
}
function requirements(value: unknown): string[] {
    if (!Array.isArray(value) || value.some(item => typeof item !== "string" || !item.trim())) {
        throw new Error("Outfit requires must be an array of non-empty strings");
    }
    return value;
}

/** Reads both legacy Outfit manifests and Captain project manifests without changing trust checks. */
export async function loadOutfitRequirements(filename: string): Promise<string[]> {
    const manifestPath = path.resolve(filename);
    const raw = object(JSON.parse(await fs.readFile(manifestPath, "utf8")), "Outfit manifest");
    if (raw.schema !== "captain/manifest/v1") {
        if (raw.schema !== undefined) throw new Error(`Unsupported manifest schema: ${String(raw.schema)}`);
        return requirements(raw.requires ?? []);
    }
    object(raw.project, "Captain project");
    const inline = raw.outfit;
    const manifestMap = raw.manifests === undefined ? {} : object(raw.manifests, "Captain manifests");
    const reference = manifestMap.outfit;
    if (inline !== undefined && reference !== undefined) {
        throw new Error("Captain outfit configuration is both inline and referenced");
    }
    let config: JsonObject;
    if (reference !== undefined) {
        if (typeof reference !== "string" || !reference.trim() || path.isAbsolute(reference) || path.win32.isAbsolute(reference) || reference.replace(/\\/g, "/").startsWith("/") || reference.replace(/\\/g, "/").split("/").includes("..")) {
            throw new Error("Captain outfit manifest reference must remain inside project root");
        }
        const root = await fs.realpath(path.dirname(manifestPath));
        const target = await fs.realpath(path.resolve(root, reference));
        if (!target.startsWith(`${root}${path.sep}`)) {
            throw new Error("Captain outfit manifest reference escapes project root");
        }
        const split = object(JSON.parse(await fs.readFile(target, "utf8")), "Outfit tool manifest");
        if (split.schema !== "captain/tool-manifest/v1" || split.tool !== "outfit") {
            throw new Error("Invalid Outfit tool manifest schema or ownership");
        }
        config = object(split.config, "Outfit tool config");
    } else if (inline !== undefined) {
        config = object(inline, "Captain outfit");
    } else {
        // Captain's established dependency declaration lives in system.requires.
        config = raw.system === undefined ? {} : object(raw.system, "Captain system");
    }
    return requirements(config.requires ?? []);
}
