# Jagports AI OS Agent Autonomy Rules

## P2.3 Define Permission Boundaries

Purpose:
Define what agent roles may execute automatically, what requires review, what requires decision approval, and what is blocked.

## Autonomy Levels

### AUTO
Allowed without approval.

Examples:
- Research and information gathering
- Documentation updates
- Backlog metadata maintenance
- Drafting proposals

### REVIEW
Execution requires review before acceptance.

Examples:
- Technical design proposals
- Workflow changes
- Non-trivial implementation approaches

### DECISION
Requires Product Owner / platform owner approval.

Examples:
- Architecture changes
- Security model changes
- Cost commitments
- Data strategy changes
- External service commitments

### BLOCKED
Not allowed without explicit authorization.

Examples:
- Spending money
- Changing ownership or access control
- Deleting critical project infrastructure
- Irreversible destructive operations

## Role Boundary Principle

Agents may execute within their assigned scope. Decisions affecting product direction, architecture, security, cost, or long-term strategy require human approval.

Status:
Draft for validation
