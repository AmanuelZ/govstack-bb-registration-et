# Project Roadmap — govstack-bb-registration-et

Last updated: 2026-03-25

## Status Legend
- ✅ DONE — Implemented, tested, issue closed honestly
- 🔧 IN PROGRESS — Partially implemented, issue open
- 📋 PLANNED — Issue created on GitHub, no work started
- 💡 FUTURE — Not yet filed as an issue

## Completed
| # | Title | Status | Notes |
|---|-------|--------|-------|
| 5 | Ethiopian fiscal calendar (ዓ.ም.) support | ✅ DONE | 31 tests, calendar utils, trade license integration |

## In Progress
| # | Title | Status | Remaining Work |
|---|-------|--------|----------------|
| 1 | Amharic localization | 🔧 IN PROGRESS | i18n foundation exists. TODO: wire into error handler, localize route responses, add Accept-Language middleware |
| 2 | Integration tests with real PostgreSQL | 🔧 IN PROGRESS | docker-compose.test.yml exists. TODO: write actual integration tests hitting real DB for all CRUD endpoints |
| 4 | Offline-first support | 🔧 IN PROGRESS | BullMQ dependency exists. TODO: implement request queue, sync-when-connected, draft storage, field officer docs |

## Planned
| # | Title | Status | Priority |
|---|-------|--------|----------|
| 3 | IM BB integration | 📋 PLANNED | Low — middleware exists, but need service registry + async patterns |
| 6 | GovStack Consent BB integration | 📋 PLANNED | Medium |
| 8 | Payment BB — Ethiopian providers | 📋 PLANNED | High |

## Future Ideas (not yet issues)
| Title | Priority |
|-------|----------|
| Accessibility compliance (WCAG 2.1) | Low |
| Monitoring (OpenTelemetry) | Medium |
| Multi-tenancy for woreda deployment | Low |
| DPIA documentation (data protection impact assessment) | Medium |
| Ethiopian Commercial Code validation rules | Low |
| Amharic SMS notifications via Consent BB | Low |
| GovStack Sandbox integration testing | Low |
| Performance benchmarks for multi-country deployment | Low |

## Session Log
| Date | What was done | Issues affected | Commits |
|------|--------------|-----------------|---------|
| Mar 23 | Initial repo publish | — | feat: initial implementation |
| Mar 25 | Created issues 1-5, implemented Ethiopian calendar, i18n foundation, CI fixes | #5 closed | 7ff340e, 2cebc0b, c28f35c |
| Mar 25 | Reopened #1, #2, #3, #4. Created roadmap. Created issues #6, #8. | #1, #2, #3, #4 reopened | docs: add project roadmap |
