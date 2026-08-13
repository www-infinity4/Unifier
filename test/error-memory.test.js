import test from "node:test";
import assert from "node:assert/strict";
import {
  createRepairNotifications,
  diagnoseRecurrence,
  evaluateAppFirst,
  findSimilarErrors,
  normalizeErrorCase
} from "../src/error-memory.js";

const known = normalizeErrorCase({
  id: "known-mobile",
  conditions: { platform: "mobile web app", formFactor: "phone", interaction: "touch", component: "navigation" },
  symptom: "Navigation button is hidden on a phone.",
  expected: "Navigation remains visible and usable by touch.",
  actual: "Desktop layout hides the navigation control.",
  affectedRepositories: ["www-infinity4/TV-Database"],
  recurrence: { count: 2 },
  priorAttempts: [{ action: "adjust CSS", outcome: "regressed", conditionalReason: "phone width", recurrenceObserved: true }]
});

test("similar phone failures retrieve prior error knowledge", () => {
  const matches = findSimilarErrors({
    conditions: { platform: "mobile web app", formFactor: "phone", interaction: "touch", component: "navigation" },
    symptom: "Navigation control is hidden on phone touch layout.",
    expected: "Navigation is visible and usable by touch.",
    actual: "Desktop layout hides the control."
  }, [known], 0.45);
  assert.equal(matches[0].record.id, "known-mobile");
});

test("repeated correction is diagnosed as recurrence rather than patched blindly", () => {
  const diagnosis = diagnoseRecurrence(known);
  assert.equal(diagnosis.recurrent, true);
  assert.equal(diagnosis.priorFixFailed, true);
  assert.match(diagnosis.diagnosis, /root cause/);
});

test("similar errors create draft repair notifications for scanned repositories", () => {
  const notifications = createRepairNotifications({
    conditions: { platform: "mobile web app", formFactor: "phone", interaction: "touch", component: "navigation" },
    symptom: "Navigation button hidden on phone.",
    expected: "Navigation visible by touch.",
    actual: "Desktop layout hides navigation.",
    affectedRepositories: ["www-infinity4/Unifier"]
  }, [known], ["www-infinity4/Unifier", "www-infinity4/TV-Database"]);
  assert.equal(notifications.length, 2);
  assert.equal(notifications.every(item => item.action === "prepare-draft-repair-pull-request"), true);
  assert.equal(notifications.every(item => item.automaticMergeAllowed === false), true);
});

test("app-first release gate reports every missing phone behavior", () => {
  const result = evaluateAppFirst({ phoneViewport: true, touchTargets: true });
  assert.equal(result.passed, false);
  assert.ok(result.failed.includes("keyboardOpen"));
  assert.ok(result.failed.includes("stateRestoration"));
});
