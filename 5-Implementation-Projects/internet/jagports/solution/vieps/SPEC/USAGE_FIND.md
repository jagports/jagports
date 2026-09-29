# VIEPS Find — usage and human UI verification

## Purpose

This file is the human-oriented usage and UI verification procedure for **Find**.

Canonical Search behavior and result-state semantics remain in [`SPEC_SEARCH.md`](SPEC_SEARCH.md). This file does not redefine Search, PART, Stock, FIT, VIN, Parts Tree, Applicable Models, or Search Results contracts.

Use this procedure after a Find implementation is deployed to verify the behavior through the same UI an end user uses.

## Target

Production VIEPS UI:

`https://vieps.parts-5ec.workers.dev/`

For the real-parts-data verification below, **do not add `TEST=1`**. Fixture mode may be used only for the optional parity check at the end.

## Human UI verification — limited free-text Find

### 1. Establish a real PART reference

1. Open the production VIEPS UI without `TEST=1`.
2. Use **Find** with a real Jaguar PART number that exists in the currently imported parts data.
3. Record:
   - the PART number shown by the UI;
   - its displayed PART description;
   - whether the result is unique or one of several candidates.
4. Confirm the identifier query still resolves normally.

This establishes the real PART and its current source-backed description without hard-coding a production catalogue example into this procedure.

### 2. Verify description fallback

1. From the displayed PART description, choose a distinctive word or short phrase that is **not** a substring of the PART number.
2. Clear **Find**.
3. Submit that description word or phrase through the same **Find** field.

Expected result:

- the descriptive query is not rejected merely because it is not a PART identifier;
- the previously identified PART is present in the resulting candidate set when its current canonical description contains the query;
- the UI does not show ordinary **Part not found** while that description match exists;
- the result is presented through the existing Search Results / Parts Tree / selected-PART regions defined by `SPEC_SEARCH.md`.

If exactly one canonical PART matches, normal resolved-PART presentation is expected.

If multiple canonical PARTs match:

- no PART is selected by default;
- matching PARTs appear through the existing candidate surfaces;
- selecting a candidate uses the normal canonical PART-selection flow.

### 3. Verify deterministic identifiers still take precedence

1. Clear **Find**.
2. Search again with the exact PART number recorded in step 1.
3. Repeat with a useful partial PART-number fragment when the current catalogue data makes that unambiguous enough to test.

Expected result:

- identifier lookup continues to resolve through the deterministic path;
- descriptive fallback does not replace a deterministic identifier result.

### 4. Verify Stock only is applied after candidate discovery

Run this check only when the current UI/data gives enough stock evidence to know the expected outcome.

1. Search by a description word/phrase as in step 2.
2. Enable **Show only parts on stock**.

Expected result:

- stocked description-matched candidates remain visible when they satisfy the supported Stock-only condition;
- non-stock candidates are removed only after the description candidates have been discovered;
- when descriptive candidates exist but Stock only removes all of them, the UI shows the localized Stock-filtered-empty message rather than ordinary **Part not found**.

Do not treat absence of stock evidence as proof of zero stock.

### 5. Verify a true no-match remains a no-match

1. Clear **Find**.
2. Enter a deliberately unique nonsense query that does not resemble a current PART number or known description, for example `zzzz-find-ui-no-match-634`.
3. Submit it.

Expected result:

- after deterministic lookup and limited free-text fallback both find no candidate, the UI shows the normal no-match state;
- no PART is fabricated or selected.

### 6. Verify clear/reset behavior

1. After any successful description search, clear the Find field using normal UI interaction.
2. Confirm the prior query result/selection does not remain presented as the active Find result.
3. Confirm independently selected supported filters are preserved according to the clear-transition contract in `SPEC_SEARCH.md`.

## Pass criteria

The human UI verification passes only when the **normal production path without `TEST=1`** demonstrates all applicable mandatory behaviors above:

- real PART identifier search still works;
- a real PART description can find its candidate PART after identifier lookup misses;
- multiple descriptive matches do not auto-select a PART;
- Stock only, when testable from current evidence, filters after candidate discovery;
- a genuine no-match still returns the no-match state;
- clearing Find removes stale Find result state.

Automated tests and `TEST=1` fixture behavior support this evidence but do **not** substitute for the normal-mode human UI check.

## Evidence to record

For an implementation acceptance comment or review, record:

- deployed URL;
- tested revision / PR;
- confirmation that `TEST=1` was absent for the real-data check;
- PART number used to establish the reference;
- description query used;
- observed unique/multiple-match behavior;
- Stock-only observation when applicable;
- no-match observation;
- clear/reset observation;
- screenshot(s) when visual evidence is required by the governing workflow.

Do not record fixture values as production Jaguar facts.

## Optional TEST-mode parity check

After the normal-mode verification passes, `?TEST=1` may be used to check that fixture-mode Find follows the same basic deterministic-first / description-fallback interaction.

Fixture evidence is synthetic and must remain identified as TEST evidence.
