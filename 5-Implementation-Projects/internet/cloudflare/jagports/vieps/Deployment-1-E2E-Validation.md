# VIEPS Deployment-1 — End-to-End Validation

Issue: #501
Parent: #496

## Validation command

Run from the Worker directory:

`4-Production/internet/cloudflare/workers/jagports/`

```text
VIEPS_BASE_URL=https://<verified-vieps-endpoint> npm run test:deployment1
```

Optional part override:

```text
VIEPS_PART_NUMBER=MJB7703AA
```

The smoke suite verifies:

1. deployed browser UI is reachable;
2. Worker `/api/health` reaches D1;
3. canonical part search returns PART and Deployment-1 context;
4. Parts Tree, image/diagram and fitment arrays are present;
5. unknown part requests return an explicit 404.

## Current execution status

**Not executed against a deployed endpoint in this repository review.** No verified Cloudflare Worker URL or D1 resource result is available in the repository at this boundary.

Therefore Deployment-1 is **not declared end-to-end validated** by this record. The validation command is prepared for execution once the Cloudflare runtime from #497 is actually provisioned and its endpoint is verified.

## Remaining limitations

- Production Cloudflare provisioning must be verified separately.
- Remote D1 migrations and fixture loading must be verified against the actual D1 resource.
- The Deployment-1 fixture data remains deterministic representative data until JEPC/Jagports data replaces it.
- Full JEPC import, VIN decoding, hotspot conversion, WDS/UFM integration, complete taxonomy, supersession/Classic, stock, third-party search, and additional search entry points remain outside Deployment-1.
