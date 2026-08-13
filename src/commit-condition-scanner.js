import { createHash } from "node:crypto";

const TRAILERS = {
  condition: /^infinity-condition:\s*(.+)$/im,
  expected: /^infinity-expected:\s*(.+)$/im,
  actual: /^infinity-actual:\s*(.+)$/im,
  reason: /^infinity-reason:\s*(.+)$/im,
  component: /^infinity-component:\s*(.+)$/im,
  errorId: /^infinity-error:\s*(.+)$/im,
  test: /^infinity-test:\s*(.+)$/im
};

const take = (text, pattern) => text.match(pattern)?.[1]?.trim() || null;
const signature = value => createHash("sha256").update(value).digest("hex").slice(0, 16);

export function parseCommitCondition(commit) {
  const text = [commit.message, commit.pullRequestBody].filter(Boolean).join("\n");
  const parsed = Object.fromEntries(Object.entries(TRAILERS).map(([key, pattern]) => [key, take(text, pattern)]));
  const declaredFields = Object.values(parsed).filter(Boolean).length;
  const inferredReason = parsed.reason || commit.message?.split("\n")[0] || "Reason not recorded";
  const condition = parsed.condition || "Condition not recorded";
  const component = parsed.component || inferComponent(commit.files || []);
  const key = `${commit.repository || "unknown"}|${component}|${condition}`.toLowerCase();

  return {
    schemaVersion: "1.0",
    repository: commit.repository,
    commit: commit.sha,
    component,
    condition,
    expected: parsed.expected,
    actual: parsed.actual,
    conditionalReason: inferredReason,
    errorId: parsed.errorId,
    regressionTest: parsed.test,
    source: declaredFields ? "declared-commit-trailers" : "inferred-from-commit",
    confidence: declaredFields >= 4 ? "high" : declaredFields ? "medium" : "low",
    conditionSignature: signature(key),
    missing: [
      !parsed.condition && "condition",
      !parsed.reason && "conditionalReason",
      !parsed.expected && "expected",
      !parsed.test && "regressionTest"
    ].filter(Boolean),
    files: commit.files || []
  };
}

function inferComponent(files) {
  if (!files.length) return "unknown-component";
  const roots = [...new Set(files.map(file => String(file).split("/")[0]))];
  return roots.length === 1 ? roots[0] : "multiple-components";
}

export function findRecommittedConditions(commits) {
  const records = commits.map(parseCommitCondition);
  const groups = new Map();
  for (const record of records) {
    const current = groups.get(record.conditionSignature) || [];
    current.push(record);
    groups.set(record.conditionSignature, current);
  }
  return [...groups.values()]
    .filter(group => group.length > 1)
    .map(group => ({
      conditionSignature: group[0].conditionSignature,
      repository: group[0].repository,
      component: group[0].component,
      occurrences: group.length,
      commits: group.map(record => record.commit),
      conditionalReasons: group.map(record => record.conditionalReason),
      status: "recurrence-review-required",
      requiredAction: "compare conditions, determine root cause, and create a regression test before another correction"
    }));
}

export function createMissingReasonNotifications(commits) {
  return commits.map(parseCommitCondition)
    .filter(record => record.missing.length)
    .map(record => ({
      type: "commit-condition-incomplete",
      repository: record.repository,
      commit: record.commit,
      missing: record.missing,
      action: "recover context from conversation, issue, pull request, diff, and tests",
      automaticCodeChangeAllowed: false
    }));
}
