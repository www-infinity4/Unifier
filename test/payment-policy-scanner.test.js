import test from "node:test";
import assert from "node:assert/strict";
import { createPaymentRepairJobs, scanInfinityOnlyExchange } from "../src/payment-policy-scanner.js";

const blockedProvider = ["Pay", "Pal"].join("");

test("active outside checkout is blocked and routed to an Infinity ledger repair", () => {
  const report = scanInfinityOnlyExchange({
    repository: "www-infinity4/example",
    files: [{ path: "index.html", content: `<button>Buy with ${blockedProvider}</button>` }]
  });
  assert.equal(report.passed, false);
  assert.equal(report.findings[0].category, "active-exchange");
  assert.match(createPaymentRepairJobs(report)[0].requiredChange, /Infinity ledger/);
});

test("generated dependency funding metadata is still caught", () => {
  const report = scanInfinityOnlyExchange({
    repository: "www-infinity4/example",
    files: [{ path: "package-lock.json", content: `{"funding":"https://${blockedProvider.toLowerCase()}.me/example"}` }]
  });
  assert.equal(report.findings[0].category, "dependency-metadata");
  assert.match(report.findings[0].replacement, /clean-lock regression/);
});

test("Infinity-only exchange copy passes", () => {
  const report = scanInfinityOnlyExchange({
    repository: "www-infinity4/example",
    files: [{ path: "index.html", content: "Format service coin from Infinity ledger" }]
  });
  assert.equal(report.passed, true);
  assert.deepEqual(report.findings, []);
});
