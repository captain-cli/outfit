import test from "node:test";
import assert from "node:assert/strict";

import {
  buildInstallationPlan
} from "../src/planning/buildPlan.js";

import type {
  DependencyResolution
} from "../src/registry/types.js";

import type {
  PackageManagerAdapter
} from "../src/adapters/packageManager.js";

function resolution(
  packageName: string
): DependencyResolution {
  return {
    requirement: `requirement.${packageName}`,
    canonicalId: `requirement.${packageName}`,
    platform: "ubuntu",
    packageManager: "apt",
    package: packageName,
    source: "ubuntu.official",
    registryVersion: "0.1.0"
  };
}

const adapter: PackageManagerAdapter = {
  name: "apt",

  async previewInstall(packages) {
    return {
      packageManager: "apt",
      requestedPackages: packages,
      changes: packages.map((name) => ({
        name,
        action: "install" as const
      })),
      rawOutput: "",
      requiresElevation: true,
      successful: true,
      warnings: []
    };
  }
};

test("builds normalized installation plan", async () => {
  const plan = await buildInstallationPlan(
    [
      resolution("libasound2-dev"),
      resolution("libssl-dev")
    ],
    adapter
  );

  assert.equal(plan.platform, "ubuntu");
  assert.equal(plan.packageManager, "apt");
  assert.equal(plan.registryVersion, "0.1.0");
  assert.equal(plan.requirements.length, 2);
  assert.equal(plan.transaction.changes.length, 2);
  assert.equal(plan.requiresElevation, true);
});

test("deduplicates identical packages", async () => {
  const plan = await buildInstallationPlan(
    [
      resolution("libssl-dev"),
      resolution("libssl-dev")
    ],
    adapter
  );

  assert.deepEqual(
    plan.transaction.requestedPackages,
    ["libssl-dev"]
  );
});

test("rejects mixed platforms", async () => {
  const a = resolution("one");
  const b = resolution("two");

  b.platform = "fedora";

  await assert.rejects(
    () =>
      buildInstallationPlan(
        [a, b],
        adapter
      ),
    /multiple platforms/
  );
});

test("rejects mixed registry versions", async () => {
  const a = resolution("one");
  const b = resolution("two");

  b.registryVersion = "0.2.0";

  await assert.rejects(
    () =>
      buildInstallationPlan(
        [a, b],
        adapter
      ),
    /multiple registry versions/
  );
});
