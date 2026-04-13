# ADR-001: Use CF GraphQL Analytics API for page view tracking

> **Status**: Accepted

## Context
Needed page view counts in admin without adding a database column or client-side tracking script beyond the existing CF beacon.

## Decision
Query the Cloudflare GraphQL Analytics API (httpRequests1dGroups) from the server for zone-level page view data. Uses clientRequestPath dimension to break down views per URL. Falls back to empty data with a helpful debug message when CF_API_TOKEN or CF_ZONE_ID aren't configured. Avoided clientRequestHTTPHost and workersInvocationsAdaptive fields which aren't available on all zone plans.

## Consequences
- (to be determined)

## Alternatives Considered
- None documented yet

## References
- Created: 2026-04-13

## See Also
- [[index]]
