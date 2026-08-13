# Infinity Unifier Robot Workforce

Unifier is the control plane that connects active Infinity repositories without flattening them into one codebase. A conversation, document, issue, or research thread can become a bounded robot with its own mission, memory references, reader jobs, writer passes, build queue, provenance, and approval history.

## What this first implementation establishes

- A generated catalog of **100 specialized readers**: ten reader families crossed with ten reasoning lenses.
- Preset Infinity, number-pattern, specific-data, and previous-pass error-catching readers.
- A writer pipeline that moves from quick capture through data, research, Infinity refinement, production, and final audit.
- A Curiosity Steward scoring system that can raise joyful, original, highly connected ideas without bypassing safety or financial approval.
- A conversation-to-robot constructor with stable identity and explicit permissions.
- Hard gates for claim verification, merges, spending, manufacturing, and physical actuation.
- A truthful proposed-reserved ledger record for the 50,000,000 Infinity China robot-factory project.
- An AI Error Memory that retrieves similar failures, diagnoses repeated corrections, and prepares cross-repository repair notifications.
- A required app-first release policy for phone interaction.
- An uncapped paginated repository inventory scanner, tested beyond GitHub's 100-result page size.
- A commit-condition scanner that records why a commit existed and detects repeated conditions.

## Operating loop

1. Preserve the original input and create a stable conversation robot.
2. Dispatch the input to the relevant readers—or all 100 for a complete sweep.
3. Store findings with source spans, confidence, uncertainty, questions, and proposed actions.
4. Let the Curiosity Steward rank promising ideas.
5. Run the writer passes, preserving a change record at every refinement.
6. Route software, research, craft, bio-humanoid, or physical-production jobs to the repository that owns them.
7. Open draft changes and run tests automatically.
8. Require recorded authorization before verifying claims, merging, spending, manufacturing, or operating hardware.
9. Feed measurements and failures back into the robot's history for the next pass.

## AI Error Memory

An error is stored as reusable operating knowledge rather than a temporary bug report. Its record includes the original conditions, expected and actual behavior, affected repositories, evidence, prior correction commits, the conditional reason for each correction, recurrence count, root-cause status, repair actions, and regression tests.

When a repository scan finds a similar condition, the Error Memory creates a repair notification for each affected repository. The robot must reproduce the condition, identify the root cause, and add a regression test before preparing a draft repair pull request. A returned failure is diagnosed as a recurrence; the robot does not repeat the same symptom-level patch and call it fixed.

## App-first contract

Infinity products are treated as applications whose primary interaction must work on phones. Production-ready status requires phone viewport, touch-target, safe-area, software-keyboard, back-navigation, state-restoration, loading/offline, portrait, and landscape checks. A failed check becomes a new Error Memory case so the lesson can protect the rest of the repository network.

## Reader geometry

Reader families are Infinity, numbers, data, evidence, connections, products, economy, provenance, human needs, and sentinel. Each family reads through literal, pattern, missing-data, contradiction, history, dependency, experiment, production, impact, and next-action lenses. This creates 100 distinct jobs from a compact, maintainable definition.

The reader engine does not pretend every result is equally true. Each reader must cite its source span and distinguish fact, project policy, hypothesis, inference, simulation, experiment, and verified result.

## Conversation robots

Each chat session can grow into a robot. The initial robot may read, research, draft, and prepare a draft pull request. It cannot merge, spend, manufacture, or control an actuator. Its later bodies—software service, page, research brain, simulated mechanism, or physical robot—remain linked to the same provenance record rather than becoming unidentified copies.

## Cross-repository reach

Unifier should discover repositories through an authorized GitHub installation and read an `infinity-project.manifest.json` from each one. It then sends build jobs to the owning repository by branch and draft pull request. It does not copy private material, credentials, or entire repositories into a central prompt.

The next production slice is a repository inventory adapter, manifest schema, persistent job store, model adapter, and dashboard showing conversations, reader findings, build jobs, approvals, and ledger state.

## Repository and commit scanners

The inventory scanner requests at most 100 repositories per provider page, then continues page by page until the provider returns a short page or explicitly reports that no next page exists. It deduplicates by full repository name and has no configured total-repository limit. The connected `www-infinity4` inventory contained 176 repositories when this slice was built: 100 on page one and 76 on page two.

Every active repository receives jobs for its manifest, app-first behavior, matching Error Memory cases, commit conditions, and research-evidence state. Names and metadata can identify a repository as science or prototyping work, but that classification never marks its scientific claims as verified.

The commit-condition scanner recognizes structured `Infinity-Condition`, `Infinity-Expected`, `Infinity-Actual`, `Infinity-Reason`, `Infinity-Component`, `Infinity-Error`, and `Infinity-Test` trailers. Older commits without these records are assigned low confidence and a context-recovery notification. When the same conditional signature appears in later commits, the scanner requires root-cause review and a regression test rather than authorizing another blind patch.

## Run the tests

```bash
npm test
```

The implementation has no third-party runtime dependencies.
