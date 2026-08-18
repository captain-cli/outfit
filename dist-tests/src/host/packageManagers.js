import { accessSync, constants, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
const PACKAGE_MANAGER_PATHS = {
    apt: [
        "/usr/bin/apt"
    ],
    "apt-get": [
        "/usr/bin/apt-get"
    ],
    dpkg: [
        "/usr/bin/dpkg"
    ],
    dnf: [
        "/usr/bin/dnf"
    ],
    yum: [
        "/usr/bin/yum"
    ],
    rpm: [
        "/usr/bin/rpm",
        "/bin/rpm"
    ],
    zypper: [
        "/usr/bin/zypper"
    ],
    pacman: [
        "/usr/bin/pacman"
    ],
    apk: [
        "/sbin/apk",
        "/usr/sbin/apk"
    ]
};
const VERIFICATION_RULES = {
    apt: {
        args: ["--version"],
        pattern: /\bapt\b/i
    },
    "apt-get": {
        args: ["--version"],
        pattern: /\bapt\b/i
    },
    dpkg: {
        args: ["--version"],
        pattern: /\bdpkg\b/i
    },
    dnf: {
        args: ["--version"],
        pattern: /\bdnf\b/i
    },
    yum: {
        args: ["--version"],
        pattern: /\byum\b/i
    },
    rpm: {
        args: ["--version"],
        pattern: /\brpm\b/i
    },
    zypper: {
        args: ["--version"],
        pattern: /\bzypper\b/i
    },
    pacman: {
        args: ["--version"],
        pattern: /\bpacman\b.*\bv\d+/is
    },
    apk: {
        args: ["--version"],
        pattern: /\bapk-tools\b/i
    }
};
function findExecutable(name) {
    for (const candidate of PACKAGE_MANAGER_PATHS[name]) {
        if (!existsSync(candidate)) {
            continue;
        }
        try {
            accessSync(candidate, constants.X_OK);
            return candidate;
        }
        catch {
            // Exists but is not executable.
        }
    }
    return undefined;
}
function verifyPackageManager(name, executable) {
    const rule = VERIFICATION_RULES[name];
    const result = spawnSync(executable, rule.args, {
        encoding: "utf8",
        timeout: 3000,
        shell: false
    });
    if (result.error) {
        return {
            verified: false
        };
    }
    const output = [
        result.stdout ?? "",
        result.stderr ?? ""
    ]
        .join("\n")
        .trim();
    if (!rule.pattern.test(output)) {
        return {
            verified: false
        };
    }
    const firstLine = output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find(Boolean);
    return {
        verified: true,
        version: firstLine
    };
}
export function detectPackageManagers() {
    return Object.keys(PACKAGE_MANAGER_PATHS).map((name) => {
        const executable = findExecutable(name);
        if (!executable) {
            return {
                name,
                executable: "",
                available: false,
                verified: false
            };
        }
        const verification = verifyPackageManager(name, executable);
        return {
            name,
            executable,
            available: verification.verified,
            verified: verification.verified,
            version: verification.version
        };
    });
}
export function selectPackageManager(family, managers) {
    const available = new Set(managers
        .filter((manager) => manager.available &&
        manager.verified)
        .map((manager) => manager.name));
    const preferences = {
        debian: [
            "apt",
            "apt-get",
            "dpkg"
        ],
        rhel: [
            "dnf",
            "yum",
            "rpm"
        ],
        suse: [
            "zypper",
            "rpm"
        ],
        arch: [
            "pacman"
        ],
        alpine: [
            "apk"
        ],
        unknown: []
    };
    return preferences[family]
        .find((name) => available.has(name));
}
//# sourceMappingURL=packageManagers.js.map