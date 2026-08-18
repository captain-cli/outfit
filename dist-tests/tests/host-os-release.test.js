import test from "node:test";
import assert from "node:assert/strict";
import { parseOsRelease, determineDistributionFamily } from "../src/host/osRelease.js";
test("parses Ubuntu os-release", () => {
    const result = parseOsRelease(`
NAME="Ubuntu"
VERSION="22.04.5 LTS (Jammy Jellyfish)"
ID=ubuntu
ID_LIKE=debian
VERSION_ID="22.04"
`);
    assert.equal(result.ID, "ubuntu");
    assert.equal(result.VERSION_ID, "22.04");
    assert.equal(result.ID_LIKE, "debian");
});
test("detects Debian family from Ubuntu", () => {
    assert.equal(determineDistributionFamily("ubuntu", ["debian"]), "debian");
});
test("detects RHEL family from Fedora", () => {
    assert.equal(determineDistributionFamily("fedora", []), "rhel");
});
test("unknown distribution fails to unknown family", () => {
    assert.equal(determineDistributionFamily("mystery-linux", []), "unknown");
});
//# sourceMappingURL=host-os-release.test.js.map