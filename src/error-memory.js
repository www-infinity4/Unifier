import { createHash } from "node:crypto";

const tokenize = value => new Set(
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
);

const overlap = (left, right) => {
  const a = tokenize(left);
  const b = tokenize(right);
  if (!a.size && !b.size) return 1;
  const intersection = [...a].filter(token => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
};

const idFor = value => createHash("sha256").update(value).digest("hex").slice(0, 16);

export function normalizeErrorCase(input) {
  if (!input?.symptom || !input?.expected || !input?.actual) {
    throw new Error("An error case requires symptom, expected, and actual behavior");
  }
  const conditions = input.conditions || {};
  const signatureSource = [
    conditions.platform,
    conditions.formFactor,
    conditions.interaction,
    conditions.component,
    conditions.route,
    input.symptom
  ].filter(Boolean).join("|");

  return {
    schemaVersion: "1.0",
    id: input.id || `error-${idFor(signatureSource)}`,
    title: input.title || input.symptom,
    status: input.status || "open",
    conditions,
    symptom: input.symptom,
    expected: input.expected,
    actual: input.actual,
    evidence: input.evidence || [],
    affectedRepositories: input.affectedRepositories || [],
    priorAttempts: input.priorAttempts || [],
    recurrence: {
      count: Number(input.recurrence?.count || 1),
      signature: input.recurrence?.signature || idFor(signatureSource),
      lastSeenAt: input.recurrence?.lastSeenAt || null
    },
    rootCause: input.rootCause || { status: "unknown", explanation: null },
    repair: input.repair || { actions: [], acceptanceTests: [] },
    notifications: input.notifications || []
  };
}

export function similarity(candidate, known) {
  const conditionFields = ["platform", "formFactor", "interaction", "component", "route", "networkState"];
  const conditionScore = conditionFields.reduce((sum, field) =>
    sum + overlap(candidate.conditions?.[field], known.conditions?.[field]), 0) / conditionFields.length;
  return (
    overlap(candidate.symptom, known.symptom) * 0.35 +
    overlap(candidate.actual, known.actual) * 0.2 +
    overlap(candidate.expected, known.expected) * 0.15 +
    conditionScore * 0.3
  );
}

export function findSimilarErrors(candidateInput, records, threshold = 0.55) {
  const candidate = normalizeErrorCase(candidateInput);
  return records
    .map(record => ({ record: normalizeErrorCase(record), score: similarity(candidate, record) }))
    .filter(match => match.score >= threshold)
    .sort((a, b) => b.score - a.score);
}

export function diagnoseRecurrence(errorCaseInput) {
  const errorCase = normalizeErrorCase(errorCaseInput);
  const attemptedButReturned = errorCase.priorAttempts.some(attempt =>
    attempt.outcome === "failed" || attempt.outcome === "regressed" || attempt.recurrenceObserved === true
  );
  const missingConditionalReason = errorCase.priorAttempts.some(attempt => !attempt.conditionalReason?.trim());
  return {
    recurrent: errorCase.recurrence.count > 1 || attemptedButReturned,
    priorFixFailed: attemptedButReturned,
    missingConditionalReason,
    diagnosis: attemptedButReturned
      ? "The symptom returned after an attempted correction; investigate the shared condition or root cause instead of repeating the patch."
      : "No failed prior correction is recorded.",
    requiredEvidence: [
      "original failure conditions",
      "commit or change that attempted the correction",
      "conditional reason for that change",
      "conditions under which the symptom returned",
      "regression test reproducing both cases"
    ]
  };
}

export function createRepairNotifications(candidateInput, records, repositoryInventory = []) {
  const candidate = normalizeErrorCase(candidateInput);
  const matches = findSimilarErrors(candidate, records);
  const repositories = new Set(candidate.affectedRepositories);
  for (const match of matches) {
    for (const repository of match.record.affectedRepositories) repositories.add(repository);
  }

  return [...repositories]
    .filter(repository => !repositoryInventory.length || repositoryInventory.includes(repository))
    .map(repository => ({
      type: "similar-error-repair-candidate",
      repository,
      errorId: candidate.id,
      matchedErrorIds: matches.map(match => match.record.id),
      action: "prepare-draft-repair-pull-request",
      requiredBeforeChange: ["reproduce-condition", "identify-root-cause", "add-regression-test"],
      automaticMergeAllowed: false
    }));
}

export function evaluateAppFirst(checks) {
  const required = [
    "phoneViewport",
    "touchTargets",
    "safeAreas",
    "keyboardOpen",
    "backNavigation",
    "stateRestoration",
    "loadingAndOffline",
    "portraitAndLandscape"
  ];
  const failed = required.filter(check => checks?.[check] !== true);
  return { passed: failed.length === 0, failed, required };
}
