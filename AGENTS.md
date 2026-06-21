# AGENTS.md

## OpenCode Skill-Driven Execution

This project uses **skill-driven execution** powered by the `skill` tool and `.agents/skills/` directory.

### Core Rules

- If a task matches a skill, you MUST invoke it
- Skills are located in `.agents/skills/<skill-name>/SKILL.md`
- Never implement directly if a skill applies
- Always follow the skill instructions exactly

### Intent → Skill Mapping

- Feature / new functionality → `spec-driven-development`, then `incremental-implementation`, `test-driven-development`
- Planning / breakdown → `planning-and-task-breakdown`
- Bug / failure / unexpected behavior → `debugging-and-error-recovery`
- Code review → `code-review-and-quality`
- Refactoring / simplification → `code-simplification`
- API or interface design → `api-and-interface-design`
- UI work → `frontend-ui-engineering`
- Web performance audit → `performance-optimization`
- Security review → `security-and-hardening`
- Shipping / deploy → `shipping-and-launch`
- Define what to build → `spec-driven-development` or `idea-refine` or `interview-me`
- Context gathering → `context-engineering`
- Documentation / ADRs → `documentation-and-adrs`
- CI/CD setup → `ci-cd-and-automation`
- Testing → `test-driven-development`
- Git workflow → `git-workflow-and-versioning`
- Observability → `observability-and-instrumentation`
- Deprecation / migration → `deprecation-and-migration`
- Browser testing → `browser-testing-with-devtools`
- Source-driven development → `source-driven-development`
- Doubt-driven development (high stakes) → `doubt-driven-development`

### Lifecycle Mapping

Follow this lifecycle automatically:

1. DEFINE → `spec-driven-development` or `idea-refine` or `interview-me`
2. PLAN → `planning-and-task-breakdown`
3. BUILD → `incremental-implementation` + `test-driven-development`
4. VERIFY → `debugging-and-error-recovery` + `browser-testing-with-devtools`
5. REVIEW → `code-review-and-quality` + `security-and-hardening` + `performance-optimization`
6. SHIP → `shipping-and-launch` + `git-workflow-and-versioning`

### Execution Model

For every request:
1. Determine if any skill applies (even 1% chance)
2. Invoke the appropriate skill using the `skill` tool
3. Follow the skill workflow strictly
4. Only proceed to implementation after required steps (spec, plan, etc.) are complete
