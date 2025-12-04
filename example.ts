import {
  atom,
  Err,
  match,
  matchAll,
  Ok,
  option,
  println,
  type NonTruthy,
  type Option,
  type Result,
} from ".";
import { maybeEmpty, maybeFail, randomTrue } from "./utils";

// println
const name = "kizz";
println("name:", name);

// atoms
const userAtom = atom("kizz");
const user2Atom = atom("kizz");

println(userAtom === atom("kizz")); // false - non interned ✅
println(userAtom.description); // "kizz"

if (userAtom === user2Atom) {
  println("all the same");
} else {
  println("not the same");
}

// result

const result = maybeFail();

println(result.type); // "Ok" or "Err"

if (result.isOk) {
  println("Success! Value is:", result.value);
} else {
  println("Failure! Reason:", result.error.type, result.error.message);
}

// Option

const a = option("hi"); // Some("hi")
const b = option(null); // None
const c = option(0); // Some(0)
const d = option(""); // None
const e = option(false); // Some(false)

if (a.isSome) {
  println("Value:", a.value);
}

if (b.isNone) {
  println("No value");
}

println("option c", c.type);
println("option d", d.type);
println("option e", e.type);

// matching
const failMaybe = maybeFail();
match(failMaybe, {
  Ok: (v) => println("ok:", v.value),
  Err: (e) => println("failed:", e.error.message),
});

const emptyMaybe = maybeEmpty();

match(emptyMaybe, {
  Some: (v) => println("got:", v.value),
  None: () => println("no value returned, none!"),
});

const ready = atom("ready");
const failed = atom("failed");

const randomBool = randomTrue();

matchAll(randomBool, {
  true: (v) => println("Yes!", v),
  false: () => println("No!"),
  _: () => println("Unknown"),
});

matchAll(ready, {
  ready: (v) => println("Ready!", v),
  failed: () => println("Failed!"),
  _: () => println("Unknown"),
});

matchAll(0, {
  0: () => println("Zero!"),
  1: () => println("One!"),
  _: () => println("Unknown"),
});

matchAll("yay", {
  foo: () => println("Bar!"),
  bar: () => println("Foo!"),
  _: () => println("Unknown for real"),
});

const newValue = atom("something").to("option");
println("new option", newValue);

const newValue2 = option("that").to("atom");
println("new atom", newValue2);

const newValue3 = option(null).to("result");
println("new result", newValue3);

const personAge = option(25).expect("a person must have age!");
println("person age", personAge);

// const personAge2 = option("").expect("a person must have age!");
// println("We never reach here, we crashed!");

// const examResults = maybeFail().expect(
//   "should pass exams first to get promoted!",
// );

// println("exams passed", examResults);

const hybridScore = maybeEmpty();

const selectedKind = hybridScore.unwrap().else(1);
println("selectedKind:", selectedKind);

if (selectedKind === 1) {
  println("Human!");
} else {
  println("Hybrid!");
}

const boolMaybe = option(false);
const safeBool = boolMaybe.unwrap().else(() => true);
println("safeBool", safeBool);

// const nothing = option(null).unwrap(); // throws error because no else chained
// println("nothing", nothing);
const something = option(20).unwrap(); // doesn't throw because option is truthy
println("something", something); // 20
