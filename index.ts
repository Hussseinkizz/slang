export const println: typeof console.log = (...args) => {
  console.log(...args);
};

/** Unique symbol to brand atoms */
declare const __atom__: unique symbol;

/** Atom type carrying the original name for hover/type info */
export type Atom<T extends string = string> = symbol & {
  readonly [__atom__]: T;
};

/**
 * Creates a new, unique atom (non-interned)
 * @param name Name of the atom (used for hover/description)
 * @example
 * const a = atom("loading");
 * typeof a; // Atom<"loading">
 */
export function atom<const T extends string>(name: T): Atom<T> {
  return Symbol(name) as Atom<T>;
}

// branding symbol
declare const __result__: unique symbol;

// Ok and Err types
export type Ok<T> = {
  type: "Ok";
  value: T;
  readonly isOk: true;
  readonly isErr: false;
  readonly [__result__]: true;
};

export type Err<E> = {
  type: "Err";
  error: E;
  readonly isOk: false;
  readonly isErr: true;
  readonly [__result__]: true;
};

// discriminated union: mutually exclusive
export type Result<T, E> = Ok<T> | Err<E>;

/**
 * Creates a new, successful result
 * @param value Value of the result
 * @example
 * const a = Ok("hello");
 * typeof a; // Ok<"hello">
 */
export function Ok<T>(value: T): Ok<T> {
  return Object.freeze({
    type: "Ok",
    value,
    isOk: true,
    isErr: false,
  } as Ok<T>);
}

/**
 * Creates a new, failed result
 * @param error Error of the result
 * @example
 * const a = Err("error");
 * typeof a; // Err<"error">
 */
export function Err<E>(error: E): Err<E> {
  return Object.freeze({
    type: "Err",
    error,
    isOk: false,
    isErr: true,
  } as Err<E>);
}

declare const __option__: unique symbol;

export type Some<T> = {
  type: "Some";
  value: T;
  readonly isSome: true;
  readonly isNone: false;
  readonly [__option__]: true;
};

export type None = {
  type: "None";
  readonly isSome: false;
  readonly isNone: true;
  readonly [__option__]: true;
};

export type Option<T> = Some<T> | None;

export type NonTruthy = null | undefined | "" | typeof NaN | typeof Infinity;

const isFalsy = (value: any) => {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    Number.isNaN(value) ||
    value === Infinity ||
    value === -Infinity
  );
};

/**
 * Creates a new truthy option
 * @param value - the value of the option
 * @example
 * const a = Some("hello");
 * typeof a; // Some<"hello">
 */
function Some<T>(value: T): Some<T> {
  if (isFalsy(value))
    throw new Error(
      "Cannot wrap null, undefined, NaN, or empty string in Some",
    );
  return Object.freeze({
    type: "Some",
    value,
    isSome: true,
    isNone: false,
  } as Some<T>);
}

const None: None = Object.freeze({
  type: "None",
  isSome: false,
  isNone: true,
} as None);

/**
 * Creates a new option type from a value
 * @param value - the value to be made an option
 * @tutorial The returned option will be Some if the value is truthy, and None if it is not (null,undefined,Nan,'')
 * @example
 * const b = option("hello");
 * typeof b; // Some<"hello">
 * const c = option(null);
 * typeof c; // None
 * const d = option(undefined);
 * typeof d; // None
 * const e = option(0);
 * typeof e; // Some<number>
 * const f = option("");
 * typeof f; // None
 * const g = option(false);
 * typeof g; // Some<boolean>
 */
export function option<T>(value: T | NonTruthy): Option<T> {
  return isFalsy(value) ? None : Some(value as T);
}

/**
 * Pattern matching for `Result` and `Option` — exhaustiveness enforced.
 *
 * Returns the value returned by the selected handler. If all handlers return
 * `Result` or `Option`, TypeScript will infer that automatically.
 */
export function match<T, E, R>(
  value: Result<T, E>,
  patterns: {
    Ok: (v: Ok<T>) => R;
    Err: (e: Err<E>) => R;
  },
): R;

export function match<T, R>(
  value: Option<T>,
  patterns: {
    Some: (v: Some<T>) => R;
    None: (v: None) => R;
  },
): R;

export function match(value: any, patterns: any): any {
  const handler = patterns[value.type];
  if (!handler) {
    throw new Error(
      `Non-exhaustive match — missing handler for '${value.type}'`,
    );
  }

  return handler(value);
}

/**
 * Allowed keys in matchAll patterns.
 * - Strings, numbers, and Atom descriptions.
 * - Booleans are represented as "true" | "false" strings
 */
type MatchKey = string | number | symbol;

/**
 * Type-safe pattern object: must always have `_` fallback.
 */
type MatchPatterns<V, R> = {
  [K in MatchKey]?: (v: V) => R;
} & { _: () => R };

const runtimeMatchKeyCheck = (key: any): key is MatchKey => {
  return (
    typeof key === "string" ||
    typeof key === "number" ||
    typeof key === "boolean" ||
    typeof key === "symbol"
  );
};

/**
 * Matches a value against literal or Atom cases by *semantic name*.
 * - Supports string, number, booleans and Atom (symbol) values.
 * - Unsupported will throw an error. (objects, arrays, functions, etc)
 * - For Atoms, uses their description as a key (e.g. atom("ready") → "ready").
 * - Requires a `_` default handler.
 *
 * @example
 * matchAll(ready, {
 *   1: () => println("One"),
 *   2: () => println("Two"),
 *   0: () => println("Zero"),
 *   true: () => println("True"),
 *   false: () => println("False"),
 *   ready: () => println("Ready!"),
 *   failed: () => println("Failed!"),
 *   _: () => println("Unknown!"),
 * });
 */
export function matchAll<T extends MatchKey | boolean, R>(
  value: T,
  patterns: MatchPatterns<T, R>,
): R {
  if (!runtimeMatchKeyCheck(value)) {
    throw new Error(`Unsupported match all value type: ${typeof value}`);
  }

  // For Atom, we use description for semantic matching
  const getSymbol = (value: any) =>
    typeof value === "symbol" ? value.description : undefined;
  const key = getSymbol(value) ?? value;

  const normalizedKey =
    typeof key === "boolean" || typeof key === "number" ? String(key) : key;

  if (normalizedKey != null && normalizedKey in patterns) {
    return (patterns as any)[normalizedKey]!(value);
  }

  return patterns._();
}
