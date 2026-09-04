# GitHub Project Modification Limitation

## Current Limitation

The available Jagports GitHub integration may be able to read repository and Issue state while not exposing the GitHub Project mutation operations required to reliably add Project Items or change their Project Item Status.

This is a **tool-capability limitation**, not evidence that the Project state is incorrect and not evidence that a requested Project mutation succeeded.

Consequently, an agent must not claim that a Project Item was added, that its Status was changed, or that a final Project state was independently verified unless the required mutation and subsequent independent read operations are both available and successful.

## Required Workaround

When Project mutation operations are unavailable:

1. Continue with all repository and Issue verification that can be performed read-only.
2. Record the exact Project operation that could not be performed or independently verified.
3. Do not create duplicate Issues merely because their Project Item state cannot be verified.
4. Do not close the related verification Issue as complete solely from repository, Issue, or historical evidence.
5. Preserve the verification task as the authoritative record until a GitHub connection with the required Project mutation/read capability is available.
6. Once such capability is available, perform the required mutation if still necessary and independently read the resulting Project Item and exact Status before claiming success.

The operational rule remains:

**MUTATE → INDEPENDENTLY VERIFY → CLAIM SUCCESS**

If mutation is unavailable, the correct result is **unverified**, not successful.

## Relation to Issue #336

Issue #336 records the detailed historical investigation of the P1–P12 Kanban import and verification. Its history should not be treated as the only place where this limitation is documented.

The limitation described here explains why an agent can verify Issue/repository state while being unable to complete the final Project Item membership/Status verification through the available connection. This document is durable operational knowledge and should be consulted before concluding that Project/Kanban state has been verified.
