#!/usr/bin/env node
/**
 * Node.js test runner — runs each test file in the MAIN process (no --test flag).
 *
 * 【Why 根源】Node 22's `node --test` forks a child process per file and uses the
 * child's stdout as the TAP/IPC message channel (parsed via structuredClone). When
 * a test file — or code under test — writes to stdout (e.g. `console.log()`), the
 * non-TAP bytes corrupt the parent's message parser, throwing "Unable to
 * deserialize cloned data due to invalid or unsupported version."
 *
 * 【Fix】Run each file as the entry point (`node --import tsx <file>`) WITHOUT the
 * `--test` flag. `node:test` auto-runs registered tests IN-PROCESS when the module
 * is the main entry — no child process, no IPC, no serialization bug.
 * `--test-force-exit` ensures the process exits even with dangling handles.
 *
 * 【Invariant】One file per process invocation; exit code is the single source of
 * truth for pass/fail. No browser tests, no external services — all 4 test files
 * are pure unit tests.
 */
import { readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve, relative } from "node:path";

process.env.CI = "true";

function collectTests(dir, base = dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      results.push(...collectTests(full, base));
    } else if (entry.endsWith(".test.ts")) {
      results.push(full);
    }
  }
  return results.sort();
}

const testDir = resolve("tests");
const files = collectTests(testDir);

console.log(`Found ${files.length} test files\n`);

let failed = 0;
for (const file of files) {
  const rel = relative(process.cwd(), file);
  console.log(`▶ ${rel}`);
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "--test-force-exit", file],
    {
      stdio: "inherit",
      env: { ...process.env, CI: "true" },
    },
  );
  if (result.status !== 0) {
    failed++;
    console.error(`✗ FAILED: ${rel}\n`);
  } else {
    console.log(`✓ ${rel}\n`);
  }
}

console.log("=".repeat(60));
if (failed > 0) {
  console.error(`✗ ${failed}/${files.length} test file(s) failed`);
  process.exit(1);
}
console.log(`✓ All ${files.length} test files passed`);
