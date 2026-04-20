# PR Review Trio

Three parallel sub-agents that review a PR from different angles, then aggregate results into a single report.

## Agents

| Agent | Focus |
|-------|-------|
| **Bug Hunter** | Logic errors, edge cases, null pointer risks, race conditions |
| **Performance Reviewer** | Re-renders, memoization, bundle size, N+1 queries, caching |
| **Security Reviewer** | Injection risks, auth gaps, exposed secrets, missing headers |

## Usage

Ask Claude Code:

```
Build a PR review trio for the current changes.
```

Or target a specific PR diff by pasting the diff or describing the files to review.

## How it works

1. The orchestrator reads the current source files and git diff.
2. Three agents are launched **in parallel**, each with a focused prompt.
3. Results are collected and aggregated into a single prioritised report.

## Output format

Each agent produces findings with:
- File path and line number
- Severity (High / Medium / Low)
- Explanation of the risk
- Suggested fix

The final summary is a merged table sorted by severity.

## Extending

To add a fourth reviewer (e.g. **Accessibility**), spawn an additional background agent alongside the existing three and include its result in the aggregation step.
