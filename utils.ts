import { Err, Ok, option, type NonTruthy, type Option, type Result } from ".";

export function maybeFail(): Result<number, { type: string; message: string }> {
  if (Math.random() > 0.5) {
    return Ok(42); // success
  } else {
    return Err({ type: "auth", message: "Invalid credentials" }); // fail
  }
}

export function maybeEmpty(): Option<number | NonTruthy> {
  if (Math.random() > 0.5) {
    return option(1);
  } else {
    return option(null);
  }
}

export function randomTrue(): boolean {
  if (Math.random() > 0.5) {
    return true;
  } else {
    return false;
  }
}
