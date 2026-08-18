import test from "node:test";
import assert from "node:assert/strict";

import {
  selectPackageManager
} from "../src/host/packageManagers.js";

import type {
  PackageManagerInfo
} from "../src/host/types.js";

function manager(
  name: PackageManagerInfo["name"],
  available: boolean,
  verified: boolean
): PackageManagerInfo {
  return {
    name,
    executable: available ? `/usr/bin/${name}` : "",
    available,
    verified
  };
}

test("prefers apt on Debian family", () => {
  const managers = [
    manager("apt", true, true),
    manager("apt-get", true, true),
    manager("dpkg", true, true)
  ];

  assert.equal(
    selectPackageManager("debian", managers),
    "apt"
  );
});

test("ignores unverified package managers", () => {
  const managers = [
    manager("apt", true, false),
    manager("apt-get", true, true),
    manager("dpkg", true, true)
  ];

  assert.equal(
    selectPackageManager("debian", managers),
    "apt-get"
  );
});

test("does not select unrelated package manager for distro family", () => {
  const managers = [
    manager("pacman", true, true)
  ];

  assert.equal(
    selectPackageManager("debian", managers),
    undefined
  );
});
