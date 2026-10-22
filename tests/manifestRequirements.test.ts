import assert from "node:assert/strict";
import {test} from "node:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {loadOutfitRequirements} from "../src/manifestRequirements.js";

test("Outfit accepts legacy, Captain system, inline and split manifests", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "outfit-manifest-"));
    try {
        const file = path.join(root, "manifest.json");
        const write = async (value: unknown) => fs.writeFile(file, JSON.stringify(value));
        const base = {schema: "captain/manifest/v1", project: {name: "demo", type: "application", version: "1.0.0"}};
        await write({requires: ["git"]});
        assert.deepEqual(await loadOutfitRequirements(file), ["git"]);
        await write({...base, system: {requires: ["curl"]}});
        assert.deepEqual(await loadOutfitRequirements(file), ["curl"]);
        await write({...base, outfit: {requires: ["wget"]}});
        assert.deepEqual(await loadOutfitRequirements(file), ["wget"]);
        await fs.mkdir(path.join(root, "manifests"));
        await fs.writeFile(path.join(root, "manifests/outfit.json"), JSON.stringify({schema: "captain/tool-manifest/v1", tool: "outfit", config: {requires: ["jq"]}}));
        await write({...base, manifests: {outfit: "manifests/outfit.json"}});
        assert.deepEqual(await loadOutfitRequirements(file), ["jq"]);
        await write({...base, outfit: {requires: []}, manifests: {outfit: "manifests/outfit.json"}});
        await assert.rejects(loadOutfitRequirements(file), /both inline/);
        await write({...base, manifests: {outfit: "../escape.json"}});
        await assert.rejects(loadOutfitRequirements(file), /inside project root/);
    } finally {await fs.rm(root, {recursive: true, force: true});}
});
