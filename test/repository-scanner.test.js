import test from "node:test";
import assert from "node:assert/strict";
import { classifyRepository, createRepositoryScanJobs, scanAllRepositories } from "../src/repository-scanner.js";
import { createMissingReasonNotifications, findRecommittedConditions, parseCommitCondition } from "../src/commit-condition-scanner.js";

const repos = Array.from({ length: 176 }, (_, index) => ({
  id: index + 1,
  repository_full_name: `www-infinity4/project-${index + 1}`,
  name: `project-${index + 1}`,
  default_branch: "main",
  archived: false
}));

test("inventory scanner passes the 100-item provider page and collects all 176 repositories", async () => {
  const calls = [];
  const inventory = await scanAllRepositories({
    owner: "www-infinity4",
    pageSize: 100,
    listPage: async ({ page, perPage }) => {
      calls.push(page);
      const start = (page - 1) * perPage;
      return { repositories: repos.slice(start, start + perPage) };
    }
  });
  assert.equal(inventory.repositoryCount, 176);
  assert.deepEqual(inventory.pages, [{ page: 1, count: 100 }, { page: 2, count: 76 }]);
  assert.deepEqual(calls, [1, 2]);
  assert.equal(createRepositoryScanJobs(inventory).length, 176);
});

test("science robot repositories are classified as prototypes without calling claims verified", () => {
  const result = classifyRepository({
    id: 1,
    repository_full_name: "www-infinity4/Humanoid-BioBots",
    name: "Humanoid-BioBots",
    description: "Biology robot prototype research",
    topics: ["robotics"]
  });
  assert.ok(result.categories.includes("science-prototyping"));
  assert.equal(result.scientificStatus, "claims-require-evidence-classification");
  assert.equal(result.appFirstRequired, true);
});

test("commit trailers preserve the actual conditional reason and test", () => {
  const record = parseCommitCondition({
    repository: "www-infinity4/TV-Database",
    sha: "abc123",
    files: ["src/share.js"],
    message: `Repair mobile share action

Infinity-Component: share-action
Infinity-Condition: Android touch after returning from player
Infinity-Expected: Share opens and credits the action
Infinity-Actual: Tap produces no response
Infinity-Reason: Listener was replaced when the player route remounted
Infinity-Error: share-regression
Infinity-Test: return from player then tap share once`
  });
  assert.equal(record.source, "declared-commit-trailers");
  assert.equal(record.confidence, "high");
  assert.equal(record.missing.length, 0);
});

test("recommitted conditions trigger root-cause review", () => {
  const base = {
    repository: "www-infinity4/TV-Database",
    files: ["src/share.js"],
    message: `Repair share
Infinity-Component: share-action
Infinity-Condition: Android touch after returning from player
Infinity-Reason: restore listener`
  };
  const repeated = findRecommittedConditions([
    { ...base, sha: "first" },
    { ...base, sha: "second" }
  ]);
  assert.equal(repeated.length, 1);
  assert.equal(repeated[0].occurrences, 2);
  assert.equal(repeated[0].status, "recurrence-review-required");
});

test("old commits with missing reasons produce context-recovery notifications, not blind edits", () => {
  const notifications = createMissingReasonNotifications([{
    repository: "www-infinity4/Old-Prototype",
    sha: "old123",
    files: ["index.html"],
    message: "fix it"
  }]);
  assert.ok(notifications[0].missing.includes("condition"));
  assert.equal(notifications[0].automaticCodeChangeAllowed, false);
});
