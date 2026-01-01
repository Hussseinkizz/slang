import { match, option, println } from "slang-ts";

println("Hello Slang!");

const cool = option(true);

match(cool, {
  Some: () => println("Cool!"),
  None: () => println("Not cool!"),
});
