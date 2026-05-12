import { assert, test } from "vitest";

test("check package exports", async () => {
  assert.exists((await import("./index.js")).LegiscanClient);
  assert.exists((await import("./index.js")).State);
});
