#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { parseCli, print } from "./cliSupport.js";
import { envelope } from "./protocol.js";
import { detectHost } from "./host/index.js";
import { loadRegistry, resolve } from "./registry.js";
const { values, positionals } = parseCli();
const op=positionals[0] ?? "help";
if(values.version){ console.log("0.1.0-dev.0"); process.exit(0); }
if(values.help || op==="help"){ console.log(`outfit detect|plan|apply [--manifest file] [--registry dir] [--json]\napply is intentionally disabled in v0.1 starter.`); process.exit(0); }
if(op==="detect"){ const host=await detectHost(); print(envelope("outfit","detect","success",host), values.json); process.exit(0); }

if (op === "host") {
  const host = detectHost();

  print(
    envelope(
      "outfit",
      "host",
      "success",
      { host }
    ),
    values.json
  );

  process.exit(0);
}

if (op === "plan") {
  const host = detectHost();

  if (!values.manifest || !values.registry) {
    throw new Error("--manifest and --registry are required");
  }

  const manifest = JSON.parse(
    await readFile(values.manifest, "utf8")
  );

  const reg = await loadRegistry(values.registry);

  const distro = host.distribution?.id ?? "unknown";
  const pm = host.selectedPackageManager ?? "unknown";

  const result = (manifest.requires ?? []).map((r: string) =>
    resolve(reg, r, distro, pm)
  );

  print(
    envelope(
      "outfit",
      "plan",
      "success",
      {
        host,
        resolutions: result
      }
    ),
    values.json
  );

  process.exit(0);
}

if(op==="apply"){ print(envelope("outfit","apply","not-implemented",{message:"Privileged apply is intentionally disabled until the approved-plan helper is implemented."}), values.json); process.exit(2); }
throw new Error(`Unknown command: ${op}`);
