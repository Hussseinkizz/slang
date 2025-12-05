# Slang Runtime APIs

**Version:** 1.1  
**Date:** December 06, 2025  
**Author:** Hussein Kizz

This specification documents the public runtime APIs exposed from `index.ts`. It focuses on real-world flows and highlights how Options, Results, Atoms, pattern matching, and utilities compose to enforce explicit, type-safe control flow.

## 1. Overview

### 1.1 Purpose
Slang provides small, composable primitives that make absence, failure, and state transitions explicit. The library favors predictable data structures over exceptions and embraces exhaustive handling.

### 1.2 Building Blocks
- **Option** — represents presence (`Some<T>`) or absence (`None`).
- **Result** — captures success (`Ok<T>`) or failure (`Err<E>`) with payloads.
- **Atom** — unique, non-interned identifiers with semantic descriptions used for state orchestration and configuration registries.
- **match / matchAll** — exhaustive pattern matching helpers for Slang types and primitive keys.
- **println** — environment-safe logging helper used across examples and tests.

### 1.3 Quick Start
```typescript
import { option, Ok, Err, atom, match, println } from "slang";

const region = option(process.env.SERVICE_REGION);
const regionAtom = region.isSome ? atom(region.value) : atom("REGION_UNSET");

const readiness = match(region, {
  Some: ({ value }) => Ok({ region: atom(value) }),
  None: () => Err({ message: "Missing REGION env" }),
});

match(readiness, {
  Ok: ({ value }) => println("control-plane ready in", value.region.description),
  Err: ({ error }) => println("boot halted:", error.message),
});
```

## 2. Option API

### 2.1 Construction Semantics
Use `option(value)` to wrap any runtime value.

```typescript
const present = option("hello");       // Some("hello")
const absent = option(undefined);       // None
const zero = option(0);                 // Some(0)
const disabled = option("");          // None
const bool = option(false);             // Some(false)
const payload = option(JSON.parse(rawBody ?? "null"));
```

**Falsy inputs promoted to `None`:** `null`, `undefined`, empty string, `NaN`, `Infinity`, `-Infinity`.
All other values, including `0`, `false`, and empty arrays/objects, become `Some<T>`.

### 2.2 Inspecting State Safely
Options expose discriminated properties for narrowing.

```typescript
const maybePort = option(process.env.PORT ? Number(process.env.PORT) : null);

const listenAddress = match(maybePort, {
  Some: ({ value }) => ({ host: "0.0.0.0", port: value }),
  None: () => ({ host: "127.0.0.1", port: 4000 }),
});

println("server binding", listenAddress.host, listenAddress.port);
```

### 2.3 expect
`expect(msg?)` unwraps or throws immediately.

```typescript
const age = option(25).expect("Author requires age");
const required = option(null).expect("Config missing"); // throws Error("Config missing")
```

### 2.4 unwrap().else()
`unwrap()` returns a chain that **must** be completed with `.else(...)`. The fallback result cannot be one of: `null`, `undefined`, `""`, `NaN`, `Infinity`, or `-Infinity` (the same values rejected by `option`).

```typescript
const apiKey = option(process.env.API_KEY)
  .unwrap()
  .else(() => {
    const rotated = rotateKeyFromVault();
    return rotated; // must satisfy option truthiness rules
  });

const retries = option(Number(process.env.RETRY_COUNT)).unwrap().else(3);

// Microtask enforcement: this throws "Expected else"
option("value").unwrap();
```

### 2.5 Conversions via `.to()`
```typescript
const banner = option("ready").to("atom");     // Atom<"ready">
const payload = option({ id: 1 }).to("result"); // Ok<{ id: 1 }>
const same = option("x").to("option");         // Returns original Option

option(null).to("result");                      // Err("Value is None")
```

### 2.6 Practical Flow – Feature Toggles
```typescript
const rawFlag = option(process.env.FEATURE_PAYMENT);

const planForTenant = match(rawFlag, {
  Some: ({ value }) => value.toLowerCase() === "enabled" ? Ok("enterprise") : Ok("standard"),
  None: () => Err("feature toggle missing"),
});

match(planForTenant, {
  Ok: ({ value }) => println("booting tenant with plan", value),
  Err: ({ error }) => println("skipping tenant boot:", error),
});
```
`Option` forces explicit decision making around missing toggles. Escalating to `Result` ensures platform services either receive a resolved plan or a structured failure reason that upstream orchestration can match on.

## 3. Result API

### 3.1 Creating Results
```typescript
import { Ok, Err } from "slang";

const success = Ok({ id: 42 });
const failure = Err({ code: 500, message: "Upstream unavailable" });
```

### 3.2 Inspecting State
```typescript
function log(result: ReturnType<typeof Ok<string>>) {
  if (result.isOk) {
    println("OK:", result.value);
  }
  if (result.isErr) {
    println("ERR:", result.error);
  }
}
```

### 3.3 expect and Error Formatting
`expect` throws using the provided message or a formatted version of the error payload (string, object with `message`, or `Error`).

```typescript
Ok("cached").expect();
Err("network").expect("Must succeed"); // throws "Must succeed"
Err({ message: "Auth failed" }).expect(); // throws "Auth failed"
```

### 3.4 Handling Results with `match`
Prefer `match` or `isOk` / `isErr` guards to keep error recovery explicit. Slang intentionally avoids introducing an Option-style `.unwrap().else()` for `Result`; modeling recoveries via pattern matching keeps both success and failure flows visible.

```typescript
const response = Ok({ status: 200 });

const rendered = match(response, {
  Ok: ({ value }) => `Status: ${value.status}`,
  Err: ({ error }) => `Failed: ${error.message ?? error}`,
});
```

### 3.5 Practical Flow – HTTP Wrapper
```typescript
async function fetchProfile(id: string) {
  const request = await safeTry(() => fetch(`/profiles/${id}`));
  if (request.err) return Err({ type: "network", cause: request.err });

  const parsed = await safeTry(() => request.result.json());
  if (parsed.err) return Err({ type: "parse", cause: parsed.err });

  return parsed.result.ok
    ? Ok(parsed.result.data)
    : Err({ type: "upstream", cause: parsed.result.error });
}

const profile = await fetchProfile("123" as const);
match(profile, {
  Ok: ({ value }) => println("Profile", value.name),
  Err: ({ error }) => println("profile failed", error.type, error.cause),
});
```
`Result` intentionally centers on `match`/type guards plus `expect` for fail-fast scenarios. Keep error payloads structured (e.g., `{ type, cause }`) so callers can branch without string parsing.

## 4. Atom API

### 4.1 Creating Atoms
```typescript
import { atom } from "slang";

const pending = atom("pending");
const failed = atom("failed");

println(pending.description); // "pending"
println(pending === atom("pending")); // false (non-interned)
```

### 4.2 Single Source of Truth for Environment Values
Atoms shine when multiple modules must share environment-driven state or configuration handles without passing raw strings.

```typescript
const ENV = {
  DATABASE_URL: atom("DATABASE_URL"),
  ANALYTICS_TOKEN: atom("ANALYTICS_TOKEN"),
} as const;

const envStore: Record<string, Option<string>> = {
  [ENV.DATABASE_URL.description]: option(process.env.DATABASE_URL ?? null),
  [ENV.ANALYTICS_TOKEN.description]: option(process.env.ANALYTICS_TOKEN ?? null),
};

export function readEnv(key: (typeof ENV)[keyof typeof ENV]) {
  return envStore[key.description];
}

const databaseUrl = readEnv(ENV.DATABASE_URL)
  .unwrap()
  .else(() => "postgres://localhost/app");
```
Every consumer receives the same Atom handle, ensuring consistent lookups and enabling pattern matching on semantic names instead of brittle string literals.

### 4.3 Conversions
```typescript
const status = atom("active");
status.to("option"); // Some("active")
status.to("result"); // Ok("active")
status.to("atom");   // identity
```

## 5. Pattern Matching

### 5.1 `match` (Option & Result)
```typescript
const payload = option(request.headers.authorization)
  .to("result")
  .to("option"); // identity, for demo

const summary = match(payload, {
  Some: ({ value }) => ({ status: "ok", token: value }),
  None: () => ({ status: "missing" }),
});
```
`match` enforces exhaustiveness at runtime and compile time. Handlers should stay small and side-effect free; pipe the resulting value to other modules rather than mutating shared state inside the match.

### 5.2 `matchAll` (Primitive/Atom values)
```typescript
const status = atom("ready");

matchAll(status, {
  ready: () => println("edge worker ready"),
  failed: () => println("edge worker failed"),
  _: () => println("edge worker unknown"),
});

matchAll(200, {
  200: () => "OK",
  500: () => "FAIL",
  _: () => "Other",
});
```
`matchAll` requires an `_` fallback, guaranteeing that every value path is handled.

### 5.3 Combined Example
```typescript
const transition = matchAll(atom("sync"), {
  sync: () => Ok(atom("ready")),
  failed: () => Err({ action: "retry" }),
  _: () => Err({ action: "escalate" }),
});

match(transition, {
  Ok: ({ value }) => println("Next state", value.description),
  Err: ({ error }) => println("Cannot transition:", error.action),
});
```

## 6. Utilities

### 6.1 println
`println(...args)` safely logs in every environment used by the project (Bun, Node, tests). It is intentionally simple to avoid coupling docs and examples to `console.*` implementations.

```typescript
import { println } from "slang";

println("User", 42, { active: true });
println(); // prints empty line
```

## 7. Error Handling Philosophy
- Represent optional configuration with `Option`; represent fallible workflows with `Result`.
- Prefer returning `{ status: false, message }` from consuming code when integrating with non-Slang callers.
- Use `safeTry` (see `utils.ts`) when bridging promise-based APIs into `Result` workflows.
- Throw only for truly exceptional developer errors (missing dependencies, invariants) and let Slang types capture all other control flow.

## 8. Best Practices
- **Trace the flow:** start with `Option` for raw inputs, convert to `Result` for operations, and finalize with `match`.
- **Centralize configuration:** wrap every environment value once, expose Atoms for lookups, and avoid repeating `process.env` throughout the codebase.
- **Keep handlers pure:** return data from `match`/`matchAll` handlers; side effects (logging, metrics) should be explicit.
- **Document conversions:** when exposing helper functions, describe which `.to()` conversions are expected so callers know the allowed targets.

## 9. TypeScript Integration
### 9.1 Type Inference
```typescript
const maybeName = option("slang");      // Option<string>
const status = Ok({ ok: true });          // Result<{ ok: true }, never>
const phase = atom("bootstrap");         // Atom<"bootstrap">
```

### 9.2 Discriminated Unions
```typescript
function asMessage(result: Result<string, Error | string>) {
  if (result.type === "Ok") return result.value;
  return typeof result.error === "string"
    ? result.error
    : result.error.message;
}
```

### 9.3 Generics as Constraints
```typescript
function unwrapOr<T>(value: Option<T>, fallback: T): T {
  return value.isSome ? value.value : fallback;
}
```

## 10. Migration Guide

### 10.1 From Exceptions
```typescript
// Before
function divide(a: number, b: number): number {
  if (b === 0) throw new Error("Division by zero");
  return a / b;
}

// After
function safeDivide(a: number, b: number): Result<number, string> {
  if (b === 0) return Err("Division by zero");
  return Ok(a / b);
}

const value = safeDivide(10, 0);
match(value, {
  Ok: ({ value }) => println("Result", value),
  Err: ({ error }) => println("Recovering:", error),
});
```

### 10.2 From Nullable Returns
```typescript
// Before
function findUser(id: string): User | null {
  return users.find((u) => u.id === id) ?? null;
}

// After
function findUser(id: string): Option<User> {
  return option(users.find((u) => u.id === id) ?? null);
}

const maybeUser = findUser("123");
match(maybeUser, {
  Some: ({ value }) => println("User", value.id),
  None: () => println("User missing"),
});
```

**Author:** [Hussein Kizz](https://github.com/Hussseinkizz)

*This specification reflects the current implementation and is subject to evolution. Contributions and feedback are welcome.*
