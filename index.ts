export const println = (...args: unknown[]): void => {
  (globalThis as any)?.console?.log?.(...args);
};

export function _to<T>(value: Option<T>, target: "option"): Option<T>;
export function _to<T extends string>(value: Option<T>, target: "atom"): Atom<T>;
export function _to<T extends string>(value: Atom<T>, target: "option"): Option<string>;
export function _to<T extends string>(value: Atom<T>, target: "atom"): Atom<T>;
export function _to<T, E = string>(value: Option<T>, target: "result"): Result<T, E>;
export function _to<E = string>(value: Atom<any>, target: "result"): Result<string, E>;

export function _to(value: any, target: "option" | "atom" | "result"): any {
  const isOption = (v: any): v is Option<any> =>
    v != null && typeof v === "object" && "isSome" in v && "isNone" in v;

  if (value && (value.type === "Ok" || value.type === "Err")) {
    throw new Error("Cannot convert a Result to any other type");
  }

  switch (target) {
    case "option": {
      if (isOption(value)) return value;
      if (typeof value === "symbol") return option(value.description);
      return option(value);
    }

    case "atom": {
      if (isOption(value)) {
        if (value.isNone) throw new Error("Cannot convert None to Atom");
        if (typeof (value as Some<any>).value !== "string") {
          throw new Error("Only string values can be converted to Atom");
        }
        return atom((value as Some<string>).value);
      }
      if (typeof value === "symbol") return value;
      throw new Error(`Cannot convert type ${typeof value} to Atom`);
    }

    case "result": {
      if (isOption(value)) {
        return value.isSome ? Ok(value.value) : Err("Value is None");
      }
      if (typeof value === "symbol") return Ok(value.description);
      return Ok(value);
    }

    default:
      throw new Error(`Invalid target: ${target}`);
  }
}

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
export function atom<const T extends string>(name: T) {
  const s = Symbol(name);
  const boxed = Object(s) as any;
  type ToFromAtom = {
    (target: "atom"): Atom<T>;
    (target: "option"): Option<string>;
    (target: "result"): Result<string, string>;
  };
  // attach methods on the boxed symbol object
  boxed.to = ((target: "atom" | "option" | "result") => (_to as any)(s, target)) as ToFromAtom;
  return boxed as Atom<T> & { to: ToFromAtom };
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

export type NonTruthy = null | undefined | "";

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
export function option<T>(value: T | NonTruthy) {
  const opt = isFalsy(value) ? None : Some(value as T);
  type ToFromOption = {
    (target: "option"): Option<T>;
    (target: "atom"): Atom<T & string>;
    (target: "result"): Result<T | (T extends string ? never : Atom<string>), string>;
  };
  const withTo = {
    ...(opt as Option<T>),
    to: ((target: "atom" | "option" | "result") => (_to as any)(opt, target)) as ToFromOption,
  };
  return withTo as Option<T> & { to: ToFromOption };
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
  // For Atom, we use description for semantic matching
  const unbox = (v: any) => (typeof v?.valueOf === "function" ? v.valueOf() : v);
  const getSymbol = (v: any) => (typeof v === "symbol" ? v.description : undefined);
  const raw = unbox(value);

  if (!runtimeMatchKeyCheck(raw)) {
    throw new Error(`Unsupported match all value type: ${typeof raw}`);
  }

  const key = getSymbol(raw) ?? raw;

  const normalizedKey =
    typeof key === "boolean" || typeof key === "number" ? String(key) : key;

  if (normalizedKey != null && normalizedKey in patterns) {
    return (patterns as any)[normalizedKey]!(value);
  }

  return patterns._();
}
