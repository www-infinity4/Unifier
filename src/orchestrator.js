import { createHash } from "node:crypto";
import { readerCatalog } from "./catalog.js";

const CLAIM_STATES = new Set([
  "proposed",
  "evidence-found",
  "simulated",
  "experimentally-tested",
  "independently-reproduced",
  "disproved",
  "needs-revision"
]);

const stableId = value => createHash("sha256").update(value).digest("hex").slice(0, 16);

export function createConversationRobot({ title, text, source = "conversation", createdAt = new Date().toISOString() }) {
  if (!text?.trim()) throw new Error("Conversation text is required");
  const id = `conversation-${stableId(`${source}\n${title}\n${text}`)}`;
  return {
    schemaVersion: "1.0",
    id,
    kind: "conversation-robot",
    title: title || "Untitled conversation",
    source,
    createdAt,
    status: "intake",
    mission: "Preserve, examine, connect, refine, test, and route this conversation into buildable work.",
    permissions: {
      mayRead: true,
      mayResearch: true,
      mayDraft: true,
      mayOpenDraftPullRequest: true,
      mayMerge: false,
      maySpend: false,
      mayControlPhysicalActuator: false
    },
    input: { text },
    claims: [],
    findings: [],
    buildJobs: [],
    history: [{ event: "created", at: createdAt }]
  };
}

export function addClaim(robot, claim) {
  if (!CLAIM_STATES.has(claim.state)) throw new Error(`Unknown claim state: ${claim.state}`);
  const next = structuredClone(robot);
  next.claims.push({
    id: claim.id || `claim-${stableId(claim.statement)}`,
    statement: claim.statement,
    state: claim.state,
    evidence: claim.evidence || [],
    uncertainty: claim.uncertainty || "not-assessed"
  });
  return next;
}

export function createReaderJobs(robot, selectors = {}) {
  const selected = readerCatalog.filter(reader =>
    (!selectors.families || selectors.families.includes(reader.family)) &&
    (!selectors.lenses || selectors.lenses.includes(reader.lens))
  );
  return selected.map(reader => ({
    jobId: `job-${stableId(`${robot.id}:${reader.id}`)}`,
    robotId: robot.id,
    reader,
    input: robot.input,
    status: "queued"
  }));
}

export function rankIdeas(ideas) {
  const weight = { originality: 3, joy: 2, connection: 3, usefulness: 3, learning: 2, buildability: 2 };
  return ideas.map(idea => ({
    ...idea,
    curiosityScore: Object.entries(weight).reduce((sum, [key, multiplier]) =>
      sum + Math.max(0, Math.min(10, Number(idea.scores?.[key] || 0))) * multiplier, 0)
  })).sort((a, b) => b.curiosityScore - a.curiosityScore);
}

export function authorizeTransition({ action, approvals = [] }) {
  const protectedActions = new Set(["verify-claim", "merge", "spend", "manufacture", "operate-actuator"]);
  if (!protectedActions.has(action)) return { allowed: true, reason: "automated-draft-action" };
  const approval = approvals.find(item => item.action === action && item.status === "approved" && item.authorizedBy);
  return approval
    ? { allowed: true, reason: "authorized-approval", approval }
    : { allowed: false, reason: "human-or-authorized-business-approval-required" };
}
