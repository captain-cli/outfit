import { readFile } from "node:fs/promises";
import type { OutfitRegistry } from "./types.js";
import { validateRegistry } from "./validateRegistry.js";
import { verifySources } from "./verifySources.js";

export async function loadRegistry(
  path: string
): Promise<OutfitRegistry> {
  const raw = await readFile(path, "utf8");

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Unable to parse registry JSON: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  const validated = validateRegistry(
     parsed as OutfitRegistry
  );

  return verifySources(validated);
}
