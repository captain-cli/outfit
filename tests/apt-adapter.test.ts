import test from "node:test";
import assert from "node:assert/strict";

import {
  parseAptSimulation
} from "../src/adapters/apt.js";

test("parses apt install transaction", () => {
  const output = `
Inst libasound2-dev (1.2.6.1-1ubuntu1 Ubuntu:22.04/jammy [amd64])
Conf libasound2-dev (1.2.6.1-1ubuntu1 Ubuntu:22.04/jammy [amd64])
`;

  const result = parseAptSimulation(output);

  assert.equal(result.length, 1);

  assert.deepEqual(result[0], {
    name: "libasound2-dev",
    action: "install",
    currentVersion: undefined,
    targetVersion: "1.2.6.1-1ubuntu1",
    architecture: "amd64",
    repositoryHints: [
      "Ubuntu:22.04/jammy"
    ]
  });
});

test("parses apt upgrade transaction", () => {
  const output = `
Inst libssl3 [3.0.2-0ubuntu1.18] (3.0.2-0ubuntu1.19 Ubuntu:22.04/jammy-updates [amd64])
`;

  const result = parseAptSimulation(output);

  assert.equal(result.length, 1);

  assert.equal(result[0].name, "libssl3");
  assert.equal(result[0].action, "upgrade");
  assert.equal(
    result[0].currentVersion,
    "3.0.2-0ubuntu1.18"
  );
  assert.equal(
    result[0].targetVersion,
    "3.0.2-0ubuntu1.19"
  );
});

test("parses apt removal transaction", () => {
  const output = `
Remv old-package [1.0.0]
`;

  const result = parseAptSimulation(output);

  assert.equal(result.length, 1);

  assert.deepEqual(result[0], {
    name: "old-package",
    action: "remove",
    currentVersion: "1.0.0"
  });
});

test("ignores unrelated apt output", () => {
  const output = `
Reading package lists...
Building dependency tree...
0 upgraded, 0 newly installed, 0 to remove.
`;

  const result = parseAptSimulation(output);

  assert.deepEqual(result, []);
});

test("parses real Ubuntu 22.04 apt simulation output", () => {
  const output = `
Inst libasound2-dev (1.2.6.1-1ubuntu1.2 Ubuntu:22.04/jammy-updates, Ubuntu:22.04/jammy-security [amd64])
Conf libasound2-dev (1.2.6.1-1ubuntu1.2 Ubuntu:22.04/jammy-updates, Ubuntu:22.04/jammy-security [amd64])
`;

  const result = parseAptSimulation(output);

  assert.equal(result.length, 1);
  assert.equal(result[0].name, "libasound2-dev");
  assert.equal(result[0].action, "install");
  assert.equal(
      result[0].targetVersion,
      "1.2.6.1-1ubuntu1.2"
  );
  assert.equal(result[0].architecture, "amd64");

  assert.deepEqual(
      result[0].repositoryHints,
      [
        "Ubuntu:22.04/jammy-updates",
        "Ubuntu:22.04/jammy-security"
      ]
  );
});
