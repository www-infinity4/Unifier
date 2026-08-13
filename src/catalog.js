const FAMILIES = [
  ["infinity", "Connect the input to Infinity policy, projects, constraints, and long-term effects."],
  ["numbers", "Inspect quantities, ratios, sequences, limits, dates, and anomalies."],
  ["data", "Extract named entities, requirements, materials, locations, amounts, and missing fields."],
  ["evidence", "Separate observations, sourced facts, hypotheses, simulations, and verified results."],
  ["connections", "Find dependencies and reusable work across conversations and repositories."],
  ["products", "Evaluate durability, repairability, materials, lifecycle, and planned obsolescence."],
  ["economy", "Trace allocations, obligations, royalties, budgets, settlements, and unresolved value claims."],
  ["provenance", "Identify creators, rights holders, source material, licenses, signatures, and chain of custody."],
  ["human-needs", "Find needs, enjoyment, frustration, delayed work, accessibility, and practical usefulness."],
  ["sentinel", "Find contradictions, unsafe actions, privacy risks, unsupported claims, and missing approvals."]
];

const LENSES = [
  ["literal", "Preserve exact statements before interpreting them."],
  ["pattern", "Find repetition, structure, and deviations."],
  ["missing", "Identify information required but not supplied."],
  ["contradiction", "Compare incompatible statements without silently choosing one."],
  ["history", "Compare the input with earlier project decisions."],
  ["dependency", "Identify what must exist before this can work."],
  ["experiment", "Turn claims into measurable tests and failure criteria."],
  ["production", "Translate the idea into buildable deliverables."],
  ["impact", "Estimate downstream effects on people, systems, and resources."],
  ["next-action", "Select the smallest useful next move."]
];

export const readerCatalog = FAMILIES.flatMap(([family, familyGoal]) =>
  LENSES.map(([lens, lensGoal], index) => ({
    id: `${family}-${String(index + 1).padStart(2, "0")}-${lens}`,
    family,
    lens,
    goal: `${familyGoal} ${lensGoal}`,
    evidenceRule: "Cite the source span; label inference and uncertainty; never upgrade a theory to verified.",
    output: ["findings", "sourceSpans", "confidence", "questions", "nextActions"]
  }))
);

if (readerCatalog.length !== 100) {
  throw new Error(`Reader catalog must contain 100 readers; found ${readerCatalog.length}`);
}

export const findReaders = ({ family, lens } = {}) => readerCatalog.filter(reader =>
  (!family || reader.family === family) && (!lens || reader.lens === lens)
);
