import { exec as _exec } from "node:child_process";
import { promisify } from "node:util";
import dotenv from "dotenv";
import { assert, test } from "vitest";

const exec = promisify(_exec);

dotenv.config({ quiet: true });

test("check cli commands", async () => {
  const { stdout } = await exec("pnpm exec tsx ./src/cli.ts --help");
  assert.include(stdout, "bill [options]", "Should show bill command help");
});
