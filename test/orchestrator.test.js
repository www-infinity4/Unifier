import test from "node:test";
import assert from "node:assert/strict";
import { readerCatalog } from "../src/catalog.js";
import { createConversationRobot, createReaderJobs, rankIdeas, authorizeTransition } from "../src/orchestrator.js";

test("catalog builds exactly 100 distinct readers", () => {
  assert.equal(readerCatalog.length, 100);
  assert.equal(new Set(readerCatalog.map(reader => reader.id)).size, 100);
});

test("each conversation becomes a bounded robot", () => {
  const robot = createConversationRobot({ title: "Bio humanoid", text: "Research a body design." });
  assert.match(robot.id, /^conversation-[a-f0-9]{16}$/);
  assert.equal(robot.permissions.mayResearch, true);
  assert.equal(robot.permissions.maySpend, false);
  assert.equal(robot.permissions.mayControlPhysicalActuator, false);
  assert.equal(createReaderJobs(robot).length, 100);
});

test("curiosity raises joyful connected ideas without granting authority", () => {
  const ranked = rankIdeas([
    { id: "ordinary", scores: { usefulness: 7, buildability: 8 } },
    { id: "loved", scores: { originality: 10, joy: 10, connection: 10, usefulness: 8, learning: 9, buildability: 5 } }
  ]);
  assert.equal(ranked[0].id, "loved");
  assert.equal(authorizeTransition({ action: "spend" }).allowed, false);
});

test("protected transitions require a recorded approval", () => {
  assert.equal(authorizeTransition({ action: "merge" }).allowed, false);
  assert.equal(authorizeTransition({
    action: "merge",
    approvals: [{ action: "merge", status: "approved", authorizedBy: "owner" }]
  }).allowed, true);
});
