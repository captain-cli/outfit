import { readFileSync } from "node:fs";
export function parseOsRelease(contents) {
    const result = {};
    for (const rawLine of contents.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) {
            continue;
        }
        const separator = line.indexOf("=");
        if (separator === -1) {
            continue;
        }
        const key = line.slice(0, separator).trim();
        let value = line.slice(separator + 1).trim();
        if ((value.startsWith("\"") && value.endsWith("\"")) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        result[key] = value;
    }
    return result;
}
export function determineDistributionFamily(id, idLike) {
    const candidates = new Set([
        id.toLowerCase(),
        ...idLike.map((value) => value.toLowerCase())
    ]);
    if (candidates.has("debian") ||
        candidates.has("ubuntu") ||
        candidates.has("linuxmint")) {
        return "debian";
    }
    if (candidates.has("rhel") ||
        candidates.has("fedora") ||
        candidates.has("centos") ||
        candidates.has("rocky") ||
        candidates.has("almalinux")) {
        return "rhel";
    }
    if (candidates.has("suse") ||
        candidates.has("opensuse") ||
        candidates.has("opensuse-leap") ||
        candidates.has("opensuse-tumbleweed")) {
        return "suse";
    }
    if (candidates.has("arch") ||
        candidates.has("manjaro")) {
        return "arch";
    }
    if (candidates.has("alpine")) {
        return "alpine";
    }
    return "unknown";
}
export function detectLinuxDistribution(path = "/etc/os-release") {
    const contents = readFileSync(path, "utf8");
    const data = parseOsRelease(contents);
    const id = (data.ID ?? "unknown").toLowerCase();
    const idLike = (data.ID_LIKE ?? "")
        .split(/\s+/)
        .map((value) => value.trim())
        .filter(Boolean);
    return {
        id,
        name: data.NAME,
        version: data.VERSION,
        versionId: data.VERSION_ID,
        idLike,
        family: determineDistributionFamily(id, idLike)
    };
}
//# sourceMappingURL=osRelease.js.map