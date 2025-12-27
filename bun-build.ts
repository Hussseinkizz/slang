await Bun.build({
  entrypoints: ["./index.ts"],
  outdir: "./dist",
  target: "node",
  minify: true,
});

export {}; // Makes this file a module to satisfy TS
