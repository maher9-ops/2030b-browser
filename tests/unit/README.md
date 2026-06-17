# Unit tests

Unit tests live next to the code they cover (Rust `#[cfg(test)] mod tests`,
TypeScript `*.test.ts`, Kotlin `src/test`, Swift `Tests/`). This directory holds
only shared unit-test fixtures and the index below.

Run all unit tests:

```sh
./build test          # Rust + TypeScript
cargo test --workspace
yarn test
```

Current coverage (test counts):

| Layer            | Suite                                   | Tests |
|------------------|-----------------------------------------|-------|
| Rust engine/IPC  | `engine-ipc`                            | 6     |
| Rust net/policy  | `engine-net`, `policy-engine`, …        | 80+   |
| Rust extensions  | `mv4-host`, `mv2-shim`, `mv3-host`, `policy-bridge` | 11 |
| Rust AI/sync     | `redaction`, `mcp-host`, `agent-runtime`, `e2ee`, … | — |
| Rust integration | `tests/integration`                     | 5     |
| TS UI            | `command-palette`, `shell-desktop`, `reader`, `pip` | 31 |
| TS ext/cloud     | `store-client`, `wasm-edition`          | 13    |
| Kotlin (JVM)     | `SecurityPolicy`                        | 4     |
| Swift            | `SecurityPolicy`, `TabModel`            | 6     |
