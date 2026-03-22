# Guidera Go-Live Mega Audit (Read-Only)

Date: 2026-03-20  
Auditor: Cursor coding agent (static code audit, no code changes made)

## Scope

This audit covers:
- Full app flows: auth, onboarding, explore, trip tabs/details/cards, connect, account/settings
- Completeness checks: stubs, placeholders, missing wiring, broken routes, dead-ends
- Code quality checks: dead/mock code, dead imports, inconsistent patterns, hardcoded values
- Design-system checks: theme/token consistency and style divergence
- Security/reliability/scalability checks: auth boundaries, edge-function trust model, abuse controls, resilience

Explicitly **not** based on prior production-readiness markdown files.

## Executive Readiness Verdict

- **Current status:** Not go-live ready for a 100k+ initial launch.
- **Go-live blockers identified:** 8
- **High-priority gaps identified:** 18
- **Medium/low polish and consistency items:** many (broadly manageable after blocker pass)

Top reason: there are still production paths that are mocked or incomplete, and several edge functions trust client-supplied identity while running with service-role privileges.

---

## Priority-Ordered Findings (Low -> High)

> Ordered as requested from low to high priority.  
> Note: execution order should be inverted in implementation (fix Critical/High first).

### Low Priority

1. **Design token drift and hardcoded color spread**
   - Evidence: many files in `src/app/**` and component folders use raw hex/rgba values instead of semantic tokens from `ThemeContext`/styles.
   - Impact: visual inconsistency, dark-mode drift, harder global redesign.

2. **Deprecated or transitional routes still present**
   - Evidence: `src/app/(auth)/sign-up.tsx` redirects to landing; `src/app/account/saved.tsx` redirects to deals-only saved.
   - Impact: mostly harmless but increases routing complexity and user expectation mismatch.

3. **Stale TODO comments where functionality already exists elsewhere**
   - Evidence: comments in `src/components/organisms/DetailHeader/DetailHeader.tsx` do not reflect template-level integration.
   - Impact: dev confusion, low user impact.

4. **Minor account/profile UX incompleteness**
   - Evidence: avatar action marked TODO in `src/features/account/screens/AccountScreen.tsx`.
   - Impact: polish gap, not launch blocking.

5. **Onboarding visuals and hardcoded style blocks**
   - Evidence: `src/app/(onboarding)/welcome-4.tsx`, `src/app/(onboarding)/welcome-5.tsx` rely heavily on static colors/styles.
   - Impact: maintainability/theming inconsistency.

### Medium Priority

1. **Error states not surfaced in major list screens**
   - Evidence:
     - `src/features/trips/screens/TripListScreen/TripListScreen.tsx` does not surface trip store `error`.
     - `src/app/(tabs)/index.tsx` renders homepage sections without explicit top-level error messaging for homepage fetch failures.
   - Impact: network/API failures look like "empty content", hurting trust and supportability.

2. **View-all events path is semantically mismatched**
   - Evidence:
     - `src/app/events/view-all.tsx` uses generic `SectionViewAll`.
     - `src/hooks/useSectionDestinations.ts` for `events` returns destination data query, not real events.
   - Impact: user taps "Events You May Like" and sees destination-style content, not event pipeline results.

3. **Inconsistent premium/security menu state versus actual screens**
   - Evidence:
     - `src/features/account/config/accountSections.config.ts` marks Security/Verification as disabled/coming soon despite dedicated screens existing.
   - Impact: user confusion and feature discoverability issues.

4. **Static rewards subtitle in account**
   - Evidence: hardcoded `2,450 points available` in `src/features/account/config/accountSections.config.ts`.
   - Impact: trust and data accuracy issues.

5. **Heavy route typing bypass (`as any`)**
   - Evidence: pervasive navigation calls with `as any` across app and features.
   - Impact: invalid routes can ship undetected; weak compile-time safety.

6. **Mock/training modules still in app surface**
   - Evidence:
     - `src/features/planning/services/aiService.ts` explicitly uses mock generation content.
   - Impact: non-real outputs in user-facing planning experiences if called from active flow.

7. **Observability partially wired**
   - Evidence:
     - `src/services/logging/logger.ts` has TODO for Sentry forwarding.
     - analytics service defaults to mock and appears lightly initialized in runtime flow.
   - Impact: incident triage and product analytics blind spots at scale.

8. **Rate limiting utilities exist but are not consistently enforced**
   - Evidence: `_shared/rateLimiter.ts` exists; key edge functions do not clearly enforce it.
   - Impact: abuse and cost-spike risk under growth.

### High Priority

1. **Broken route: connected apps**
   - Evidence:
     - `src/app/account/privacy.tsx` pushes `/account/connected-apps`.
     - No `src/app/account/connected-apps*.tsx` route file found.
   - Impact: broken navigation from privacy settings.

2. **Broken route: premium upsell destination**
   - Evidence:
     - `src/features/community/screens/BuddyProfileScreen.tsx` routes to `/premium`.
     - No `src/app/**/premium*.tsx` route file found.
   - Impact: broken premium conversion flow.

3. **Explore detail route remains fully mocked**
   - Evidence: `src/app/detail/[id].tsx` contains large `MOCK_DATA` object and fallback to default entry for unknown IDs.
   - Impact: incorrect content rendered for real IDs/deep links; credibility risk.

4. **Trip edit is a dead-end placeholder**
   - Evidence: `src/app/trip/edit.tsx` explicitly states "coming soon."
   - Impact: core post-booking editing expectation is unmet.

5. **Trip detail can render infinite skeleton on missing trip**
   - Evidence: `src/features/trips/screens/TripDetailScreen/TripDetailScreen.tsx` returns skeleton whenever `!trip` (no terminal not-found/error state).
   - Impact: users can get stuck in perpetual loading with invalid/deleted IDs.

6. **Onboarding setup redirects even when save fails**
   - Evidence: `src/app/(onboarding)/setup.tsx` catch branch still redirects to tabs after delay.
   - Impact: users can enter app with incomplete or unsynced profile state.

7. **2FA flow is partly mock/placeholder**
   - Evidence:
     - `src/app/account/two-factor-auth.tsx` includes TODO for SMS backend integration.
     - Authenticator setup still uses placeholder QR/setup key.
   - Impact: users may believe security is enabled with non-production verification path.

8. **Privacy compliance UX not fully wired**
   - Evidence: `src/app/account/privacy.tsx` "Request Download" path TODO then success alert.
   - Impact: legal/compliance mismatch risk for data export requests.

9. **Connect entitlement hardcoded**
   - Evidence: `src/features/community/screens/CommunityHubScreen.tsx` sets `isPremium = true` and passes to buddy connect flow.
   - Impact: monetization and access-control logic bypassed in connect interactions.

10. **Production endpoints with broad CORS and no strict caller binding in some paths**
    - Evidence: several edge functions use wildcard CORS and accept body-driven identifiers.
    - Impact: increased abuse surface when endpoints become known.

### Critical Priority (Go-Live Blockers)

1. **Service-role edge functions trust client-provided identity**
   - Evidence:
     - `supabase/functions/chat-assistant/index.ts` accepts `userId` from request body and writes with service-role client.
     - `supabase/functions/provider-manager/index.ts` accepts `userId` from request body with service-role client.
   - Impact: identity spoofing, cross-user data attribution, abuse/cost attacks.

2. **Google API proxy allows high-cost API usage without robust caller auth/rate caps**
   - Evidence: `supabase/functions/google-api-proxy/index.ts` exposes multi-action proxy with wildcard CORS and no clear enforced auth/rate gate.
   - Impact: quota burn and financial abuse.

3. **Crash-report email endpoint can be abused**
   - Evidence: `supabase/functions/send-crash-report/index.ts` accepts arbitrary payload/email flow without clear auth/rate limit checks.
   - Impact: spam, vendor cost abuse, noisy ops channel.

4. **Rate-limiter design currently fail-open**
   - Evidence: `_shared/rateLimiter.ts` allows request on limiter error.
   - Impact: under DB issues or bypass scenarios, protection silently fails.

5. **Identity model mismatch risk in policy assumptions**
   - Evidence: app comments assume Clerk-to-profile mapping; several SQL policies/paths rely on exact identity semantics.
   - Impact: either over-permission or false denials depending on deployment config drift.

---

## Flow-by-Flow Functional Audit

## 1) Authentication

What is good:
- Core sign-in flow is richer (email/password + phone OTP orchestration + SSO).
- Forgot-password flow uses Clerk reset strategy and verification step.

Gaps:
- Transitional links to deprecated route aliases remain in auth-related redirects.
- Some social/auth states are UX-heavy but not fully hardened against backend failure messaging consistency.

Readiness: **Mostly functional**, but needs route cleanup and consistency polish.

## 2) Onboarding

What is good:
- Multi-step onboarding data capture exists and writes profile/travel preferences.

Gaps:
- Setup redirect on failed save is a major reliability issue.
- Legacy preference route files that immediately redirect still exist.

Readiness: **Not fully safe** until save-success gating is strict.

## 3) Explore (requested deep section audit)

### Deals
- Section and view-all are real and dynamic (`useGilDeals`), with loading/empty handling.
- Risk: visual token inconsistency and heavy hardcoded style palette.

### Popular Destinations
- Card stack route uses real destination IDs and pushes `/destinations/[id]`.
- Risk: parallel `/detail/[id]` route remains mocked and can surface wrong fallback content.

### Popular Places
- Wired to homepage data and destination detail route.
- Generally complete.

### Events You May Like
- Section uses events discovery pipeline (`useEvents` + `eventsService`) and card stack.
- **Major mismatch:** events view-all route currently uses generic destination list query path.

### Must See
- Section appears wired with homepage data and destination detail.
- View-all route uses generic section list path; data semantics depend on section slug query logic.

Explore readiness: **Partially production-ready**, but blocked by mocked detail route and events view-all mismatch.

## 4) Trips (tab + cards + trip detail)

What is good:
- Trip list architecture is solid (tabs, list states, refresh, card composition).
- Trip hub has broad feature surface and deep links.

Gaps:
- Trip edit is still coming-soon placeholder.
- Trip detail missing explicit not-found/error when trip absent.
- Store error not surfaced in list UI.

Trips readiness: **Not launch-complete** for expected post-booking management quality.

## 5) Connect

What is good:
- Connect hub has substantial real data integration and sections.

Gaps:
- Premium entitlement hardcoded true in hub flow.
- Missing premium destination route.
- Several "coming soon"/partial persistence areas in related settings/features.

Connect readiness: **Functionally rich but entitlement/routing integrity is not production-safe yet.**

## 6) Account + Settings (menu-by-menu)

What is good:
- Strong screen coverage and section architecture.
- Many routes exist for key settings pages.

Gaps:
- Broken connected-apps route from privacy.
- Data download request path not implemented despite success messaging.
- 2FA and verification/security are inconsistent between menu state and implementation status.
- Missing account QR route (`/account/qr-code`) referenced in quick actions.

Account readiness: **Needs routing/compliance/security flow hardening before launch.**

---

## Security and Scale Readiness Summary

Current risk profile is **high** for a large launch unless edge-function auth and abuse controls are tightened first.

Most urgent security/scaling themes:
- Enforce verified identity on all service-role edge functions.
- Never trust `userId` in request body without server-side identity binding.
- Add strict per-user/IP/device throttles and budget guards for high-cost APIs.
- Add request size/rate and abuse controls on crash/reporting and proxy endpoints.
- Complete observability chain (Sentry + structured logs + alerting).

---

## Dead Code / Mock Code / Inconsistency Signals

- TODO/FIXME markers observed across many files (at least dozens; broad distribution).
- Mock/service placeholder hotspots:
  - `src/app/detail/[id].tsx`
  - `src/features/planning/services/aiService.ts`
  - `src/app/account/two-factor-auth.tsx`
  - `src/app/account/privacy.tsx`
  - `src/app/trip/edit.tsx`
- Strong style-token drift: substantial hardcoded hex usage in app screens/components.
- Route safety weakened by many `as any` navigation calls.

---

## Phased Remediation Plan

## Phase 1 (Low Priority - Polish & Consistency)

- Normalize theme token usage in top 20 highest-traffic screens.
- Remove stale comments and deprecated redirect-only routes where safe.
- Align minor copy/status labels and account subtitle dynamic values.

Exit criteria:
- Design QA pass on theme parity (light/dark).
- Zero stale TODO comments in user-facing component headers.

## Phase 2 (Medium Priority - UX Reliability)

- Add explicit error/empty/retry UX for trips and homepage failures.
- Fix events view-all to use events dataset, not destination fallback list.
- Reduce `as any` navigation in critical flows with typed route helpers.

Exit criteria:
- Simulated network-failure walkthrough across auth, explore, trips, account.
- No silent-empty major screens under API failure.

## Phase 3 (High Priority - Functional Completeness)

- Fix broken routes (`/account/connected-apps`, `/premium`, `/account/qr-code`) or remove entry points.
- Replace mocked `/detail/[id]` with real data source or deprecate route entirely.
- Complete trip edit or remove access path before release.
- Enforce strict onboarding save success before entering tabs.
- Finish/disable incomplete 2FA and privacy data export actions.
- Replace hardcoded premium entitlement with real subscription check.

Exit criteria:
- Route crawl with zero unmatched navigation targets in core flows.
- No "coming soon" dead-end on core journeys.

## Phase 4 (Critical Priority - Security & Scale Blockers)

- Require authenticated/verified identity on all service-role edge functions.
- Remove trust in body-level `userId`; derive identity server-side.
- Enforce hard rate limits (no fail-open for critical paths).
- Add abuse controls for cost-heavy proxy endpoints.
- Harden crash-report endpoint (auth, throttling, payload limits).
- Validate and standardize RLS identity assumptions.
- Wire production observability (Sentry + alerts + incident dashboards).

Exit criteria:
- Security review sign-off on edge-function auth model.
- Load/abuse tests against public endpoints with enforced limits.
- Incident alerting proven in staging.

---

## Go-Live Checklist (Must Pass)

- [ ] No broken routes in primary user journeys
- [ ] No mocked core user-facing data in production paths
- [ ] Edge functions validated for identity spoofing resistance
- [ ] Rate limiting and abuse controls enabled on expensive/public endpoints
- [ ] 2FA/privacy claims match actual backend behavior
- [ ] Core flows have user-visible error handling + retry
- [ ] Monitoring, logging, and alerts validated in release environment

---

## Recommended Immediate Next Actions (48-72 hours)

1. Security strike team on edge functions (`chat-assistant`, `provider-manager`, `google-api-proxy`, `send-crash-report`).
2. Route integrity pass for account/connect and premium upsell paths.
3. Replace or remove mocked detail route and planning mock path from user-facing entry points.
4. Add resilient error states for homepage and trip list/detail.
5. Run a pre-release QA script over all flows listed in this document after fixes.

