# VIEPS Find — usage and human UI verification

## Purpose

This file is the human-oriented usage and UI verification procedure for **Find**.

Shared Search behavior and result-state semantics remain in [`SPEC_SEARCH.md`](SPEC_SEARCH.md). Find-specific behavior and acceptance are defined in [`SPEC_SEARCH_FIND.md`](SPEC_SEARCH_FIND.md). This file is the human execution procedure and does not redefine PART, Stock, FIT, VIN, Parts Tree, Applicable Models, or Search Results contracts.

Use this procedure after a Find implementation is deployed to verify the behavior through the same UI an end user uses.

## Human test targets

Run the Find human UI workflow against **both** deployed modes:

| Mode | URL | Data |
|---|---|---|
| Normal | `https://vieps.parts-5ec.workers.dev/` | Current imported parts data |
| TEST | `https://vieps.parts-5ec.workers.dev/?TEST=1` | Synthetic TEST fixtures |

Both are human UI tests. Neither mode substitutes for the other.

- **Normal mode** proves the end-user path works against current imported parts data.
- **TEST=1 mode** proves the deterministic fixture path works through the deployed UI and provides repeatable human regression evidence.
- TEST fixture values must remain identified as synthetic evidence and must never be reported as production Jaguar facts.

The same behavioral checks below apply to both modes unless a step explicitly distinguishes the data source.

## Human UI verification — limited free-text Find

Perform sections 1–6 once in **Normal mode** and once in **TEST=1 mode**.

### 1. Establish a PART reference

1. Open the target mode.
2. Use **Find** with a PART number that exists in that mode:
   - Normal: a real Jaguar PART number from the currently imported parts data.
   - TEST=1: a fixture PART number from the deployed TEST data.
3. Record:
   - test mode used;
   - PART number shown by the UI;
   - displayed PART description;
   - whether the result is unique or one of several candidates.
4. Confirm the identifier query resolves normally.

The reference must be established from the same deployed mode that is being tested. Do not use a TEST fixture to prove normal-mode behavior or a production PART to assume TEST-mode behavior.

### 2. Verify description fallback

1. From the displayed PART description, choose a distinctive word or short phrase that is **not** a substring of the PART number.
2. Clear **Find**.
3. Submit that description word or phrase through the same **Find** field.

Expected result in both modes:

- the descriptive query is not rejected merely because it is not a PART identifier;
- the previously identified PART is present in the resulting candidate set when its description contains the query;
- the UI does not show ordinary **Part not found** while that description match exists;
- the result is presented through the existing Search Results / Parts Tree / selected-PART regions defined by `SPEC_SEARCH_FIND.md`.

If exactly one canonical PART matches, normal resolved-PART presentation is expected.

If multiple canonical PARTs match:

- no PART is selected by default;
- matching PARTs appear through the existing candidate surfaces;
- selecting a candidate uses the normal canonical PART-selection flow.

### 3. Verify deterministic identifiers still take precedence

1. Clear **Find**.
2. Search again with the exact PART number recorded in section 1.
3. Repeat with a useful partial PART-number fragment when the current mode's data provides a meaningful partial-match case.

Expected result in both modes:

- identifier lookup continues to resolve through the deterministic path;
- descriptive fallback does not replace a deterministic identifier result.

### 4. Verify Stock only is applied after candidate discovery

1. Search by a description word/phrase as in section 2.
2. Enable **Show only parts on stock**.
3. Exercise both a stocked and a filtered-empty case when the target mode provides suitable evidence.

Expected result:

- stocked description-matched candidates remain visible when they satisfy the supported Stock-only condition;
- non-stock candidates are removed only after the description candidates have been discovered;
- when descriptive candidates exist but Stock only removes all of them, the UI shows the localized Stock-filtered-empty message rather than ordinary **Part not found**.

For **TEST=1**, choose fixture data that provides deterministic stock evidence so this behavior can be repeated.

For **Normal mode**, use current operational stock evidence. Do not infer zero stock from missing or unresolved stock evidence. If one of the two Stock-only cases cannot be produced from current real data, record that limitation explicitly rather than fabricating a result.

### 5. Verify a true no-match remains a no-match

1. Clear **Find**.
2. Enter a deliberately unique nonsense query that does not resemble a PART number or known description in the target mode, for example `zzzz-find-ui-no-match-634`.
3. Submit it.

Expected result in both modes:

- after deterministic lookup and limited free-text fallback both find no candidate, the UI shows the normal no-match state;
- no PART is fabricated or selected.

### 6. Verify clear/reset behavior

1. After any successful description search, clear the Find field using normal UI interaction.
2. Confirm the prior query result/selection does not remain presented as the active Find result.
3. Confirm independently selected supported filters are preserved according to the clear-transition contract in `SPEC_SEARCH_FIND.md`.

Run this check in both modes.

## Pass criteria

Human UI acceptance requires **two separate completed test records**:

1. Normal mode.
2. TEST=1 mode.

For each mode, the record must demonstrate:

- PART identifier search works;
- PART-description search reaches the limited free-text fallback after identifier lookup misses;
- descriptive matches use the existing result surfaces;
- multiple descriptive matches do not auto-select a PART when such a case is exercised;
- Stock only is applied after candidate discovery, with any unavailable real-data case explicitly recorded;
- a genuine no-match returns the no-match state;
- clearing Find removes stale Find result state.

The overall human UI acceptance does not pass merely because automated tests pass, and it does not pass with only one of the two deployed modes tested.

Automated tests remain regression support. They do not replace human interaction with either deployed mode.

## Evidence to record

For **each mode**, record:

- deployed URL, including whether `TEST=1` is present;
- tested revision / PR;
- mode: Normal or TEST;
- PART number used to establish the reference;
- description query used;
- observed resolved or multiple-match behavior;
- Stock-only observations, including any real-data limitation that prevents a specific case;
- no-match observation;
- clear/reset observation;
- screenshot(s) when visual evidence is required by the governing workflow.

Keep Normal and TEST evidence clearly separated in the acceptance comment or review.

TEST fixture values are synthetic test evidence. Normal-mode values are current deployed data evidence.
