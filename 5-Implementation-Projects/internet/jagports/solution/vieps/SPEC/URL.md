# VIEPS URL contract

## TEST mode

`TEST=1` selects fixture-backed VIEPS responses for the current request.

`TEST` absent, empty, or set to any value other than `1` selects real-mode responses.

The parameter is request-scoped. It does not change persisted data.

## Response mode

Fixture mode returns fixture provenance and the established fixture behaviour.

Real mode returns available imported catalogue evidence and non-fixture operational stock. It must not present unverified fit as confirmed fitment. Unavailable images, hotspots, or fit remain unavailable.

When real-mode data is unavailable, the response must identify that unavailable state. It must not fall back to fixtures.

## URL propagation

The page URL's `TEST=1` value is retained in its catalogue and stock API requests. Direct API requests use the same parameter.
