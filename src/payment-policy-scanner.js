const POLICY_FILES = new Set([
  "src/payment-policy-scanner.js",
  "policies/infinity-only-exchange.json"
]);

const providerRules = [
  { id: "outside-wallet-checkout", terms: [["pay", "pal"].join("")] },
  { id: "card-processor-checkout", terms: ["stripe checkout", "stripe.com", "stripe("] },
  { id: "cash-app-transfer", terms: ["cash.app/", "$cashtag"] },
  { id: "venmo-transfer", terms: ["venmo.com/", "venmo checkout"] },
  { id: "bank-transfer", terms: ["routing number", "bank transfer", "wire transfer"] },
  { id: "outside-money-price", terms: ["price usd", "amount usd", "(usd)"] }
];

const lineNumberAt = (content, index) => content.slice(0, index).split("\n").length;

function classify(path, line) {
  if (/package-lock\.json$|yarn\.lock$|pnpm-lock\.yaml$/i.test(path)) return "dependency-metadata";
  if (/readme|docs?\//i.test(path)) return "documentation";
  if (/checkout|payment|wallet|price|purchase|buy|bid|form|client.?id|script/i.test(line)) return "active-exchange";
  return "source-reference";
}

export function scanInfinityOnlyExchange({ repository, files }) {
  const findings = [];
  for (const file of files || []) {
    const path = String(file.path || "");
    if (POLICY_FILES.has(path)) continue;
    const content = String(file.content || "");
    const lower = content.toLowerCase();

    for (const rule of providerRules) {
      for (const term of rule.terms) {
        let cursor = 0;
        while ((cursor = lower.indexOf(term, cursor)) !== -1) {
          const start = lower.lastIndexOf("\n", cursor) + 1;
          const endRaw = lower.indexOf("\n", cursor);
          const end = endRaw === -1 ? content.length : endRaw;
          const line = content.slice(start, end).trim();
          const category = classify(path, line);
          findings.push({
            repository,
            path,
            line: lineNumberAt(content, cursor),
            rule: rule.id,
            category,
            blocking: true,
            replacement: category === "dependency-metadata"
              ? "remove provider funding metadata and add a clean-lock regression check"
              : "replace with an Infinity ledger transfer or Infinity-derived service coin"
          });
          cursor += term.length;
        }
      }
    }
  }

  return {
    repository,
    policy: "infinity-only-exchange",
    passed: findings.length === 0,
    findings
  };
}

export function createPaymentRepairJobs(report) {
  return report.findings.map(finding => ({
    type: "infinity-only-exchange-repair",
    repository: finding.repository,
    path: finding.path,
    line: finding.line,
    rule: finding.rule,
    requiredChange: finding.replacement,
    automaticMergeAllowed: false,
    regressionCheck: "rescan repository and require zero blocking findings"
  }));
}
