# Outfit

Captain's OS/environment dependency manager. Outfit converts canonical capabilities into OS-native package requirements for the detected platform while enforcing registry, mapping, and source integrity.

## v0.1

- Detect Linux distribution, release, architecture, and package manager.
- Resolve canonical requirements through Outfit Registry.
- Trust the exact `(capability, platform, package manager, package, source)` mapping tuple.
- Support APT and DNF planning first.
- Never mutate during `detect`, `check`, or `plan`.
- Keep `apply` disabled until the privileged-helper contract is complete.

```bash
npm install
npm run dev -- detect --json
npm run dev -- plan --manifest examples/outfit.json --registry ../outfit-registry --json
```
