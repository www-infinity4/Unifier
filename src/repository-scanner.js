const SCIENCE_TERMS = new Set([
  "atomic", "bio", "biology", "boron", "chemistry", "coherence", "electromagnetism",
  "element", "energy", "fusion", "hydrogen", "humanoid", "laser", "material", "nuclear",
  "physics", "propulsion", "quantum", "radon", "robot", "robotics", "science", "soil", "transmutation"
]);

const PROTOTYPE_TERMS = new Set([
  "assembler", "device", "engine", "factory", "hardware", "machine", "mechanism",
  "prototype", "regulator", "robot", "system", "tool"
]);

const words = value => String(value || "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .split(/\s+/)
  .filter(Boolean);

export async function scanAllRepositories({ listPage, owner, pageSize = 100, onPage = () => {} }) {
  if (typeof listPage !== "function") throw new Error("listPage adapter is required");
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new Error("pageSize must be between 1 and 100");
  }

  const repositories = new Map();
  const pages = [];
  let page = 1;

  while (true) {
    const response = await listPage({ owner, page, perPage: pageSize });
    const items = Array.isArray(response) ? response : response?.items || response?.repositories || [];
    pages.push({ page, count: items.length });
    onPage({ page, count: items.length, totalUnique: repositories.size });

    for (const repository of items) {
      const fullName = repository.fullName || repository.repository_full_name || repository.full_name;
      if (!fullName) continue;
      repositories.set(fullName.toLowerCase(), normalizeRepository(repository));
    }

    const explicitNext = response?.hasNextPage ?? response?.has_next_page;
    if (explicitNext === false || items.length < pageSize || items.length === 0) break;
    page += 1;
  }

  return {
    owner,
    repositoryCount: repositories.size,
    pages,
    repositories: [...repositories.values()]
  };
}

export function normalizeRepository(repository) {
  const fullName = repository.fullName || repository.repository_full_name || repository.full_name;
  return {
    id: String(repository.id || fullName),
    fullName,
    name: repository.name || fullName?.split("/").at(-1),
    description: repository.description || "",
    defaultBranch: repository.defaultBranch || repository.default_branch || "main",
    visibility: repository.visibility || "unknown",
    archived: Boolean(repository.archived),
    topics: repository.topics || [],
    manifestPath: "infinity-project.manifest.json"
  };
}

export function classifyRepository(repository) {
  const corpus = words([
    repository.name,
    repository.description,
    ...(repository.topics || [])
  ].join(" "));
  const scienceMatches = [...new Set(corpus.filter(word => SCIENCE_TERMS.has(word)))];
  const prototypeMatches = [...new Set(corpus.filter(word => PROTOTYPE_TERMS.has(word)))];
  const categories = [];
  if (scienceMatches.length) categories.push("science");
  if (prototypeMatches.length) categories.push("prototyping");
  if (scienceMatches.length && prototypeMatches.length) categories.push("science-prototyping");
  if (!categories.length) categories.push("unclassified");

  return {
    ...normalizeRepository(repository),
    categories,
    classificationEvidence: { scienceMatches, prototypeMatches },
    scientificStatus: scienceMatches.length ? "claims-require-evidence-classification" : "not-assessed",
    appFirstRequired: true
  };
}

export function createRepositoryScanJobs(inventory) {
  return inventory.repositories
    .filter(repository => !repository.archived)
    .map(repository => {
      const classified = classifyRepository(repository);
      return {
        type: "repository-scan",
        repository: classified.fullName,
        defaultBranch: classified.defaultBranch,
        manifestPath: classified.manifestPath,
        categories: classified.categories,
        scans: ["manifest", "app-first", "infinity-only-exchange", "error-memory", "commit-conditions", "research-evidence"],
        permissions: { mayOpenDraftPullRequest: true, mayMerge: false }
      };
    });
}
