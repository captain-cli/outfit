# Captain Tool Contract v0.1

Every Captain tool must expose predictable, machine-readable behavior. Human-oriented output is allowed, but Captain must never need to scrape it.

## Baseline CLI

- `--help`, `--version`
- `--json` for the tool envelope
- `--verbose`, `--quiet`
- non-mutating commands should prefer `inspect`, `validate`, or `plan`
- mutations should be explicit (`apply`, `build`, `generate`, etc.)

## Response envelope

```json
{
  "tool": "outfit",
  "version": "0.1.0-dev.0",
  "operation": "plan",
  "status": "success",
  "changed": false,
  "warnings": [],
  "errors": [],
  "result": {}
}
```

## Safety rules

1. `inspect`, `validate`, and `plan` are non-mutating.
2. Secrets are never printed unless an explicit developer-only reveal flag is supplied.
3. Privileged execution must be isolated from normal planning logic.
4. Tool inputs and outputs are structured data, not generated shell commands.
5. Existing state changes must be detectable before mutation.
