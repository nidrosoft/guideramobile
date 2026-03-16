# Guidera Final Production Audit

Date: 2026-03-15
Mode: Review only, no runtime code changes
Auditor: GPT multi-pass repo audit

## Scope
This audit reviewed the Expo app, shared components, feature modules, auth/account flows, community/connect surfaces, trip and booking systems, navigation/AR/AI flows, and Supabase edge functions. The goal was to identify launch-risky issues before opening the app to real users.

This is a production-readiness audit, not a style-only review. Findings prioritize:
- Security and privacy failures
- Mock or placeholder behavior presented as real functionality
- Broken or misleading user flows
- Theme/design-system drift and hard-coded UI values
- Dead code, TODO debt, and incomplete integrations
- Reliability and scaling risks

## Audit Method
This report was assembled in multiple passes:
1. Repo-wide scan for TODOs, mock/fallback code, placeholder flows, and hard-coded visual values
2. Parallel domain reviews for auth/account, trips/booking, community/connect, and navigation/AI/infrastructure
3. Spot-check verification of the highest-risk findings in source files
4. Cross-cutting pass for theme-system duplication, notification consistency, and edge-function exposure

## Executive Summary
The app is visually far along, but it is not yet production-ready for a broad launch.

The biggest pattern across the codebase is that several polished surfaces are still simulated behind the UI. In multiple places the app claims to support security, account deletion, trip import, community messaging, package booking, SOS, notifications, or AI-powered workflows, but the underlying implementation is placeholder, mock-backed, or wired to the wrong system.

## Launch Blockers
These should be treated as blockers before a full public rollout:

1. Auth/account security screens are wired to the wrong backend and can mislead users about their account protection.
2. Two-factor authentication is not real, but the UI can mark it enabled.
3. Delete-account is not an actual deletion flow.
4. Trip import is largely placeholder code, including token handling and account linking.
5. Community direct messaging can route using user IDs where conversation IDs are expected.
6. Community notifications deep-link to routes that do not exist.
7. AI Vision and other edge functions expose billable or privileged behavior without visible caller enforcement.
8. AI Vision also calls Google Vision/Translation directly from the client using a public Expo env key.
9. SOS notification flow calls a `send-notification` contract that does not match the deployed edge function.
10. Navigation, safety, and some booking/package features are still partially demo or "coming soon" behavior behind shippable UI.

## Critical Findings

### 1. Security settings target Supabase Auth while live auth is Clerk
- Area: Auth / Account Security
- Files: `src/app/_layout.tsx`, `src/context/AuthContext.tsx`, `src/app/account/change-password.tsx`, `src/app/account/security.tsx`, `src/app/account/active-sessions.tsx`, `src/lib/supabase/client.ts`
- Impact: Users can believe their password, session revocation, and security settings are enforced when the real auth/session model is handled by Clerk.
- Evidence:
  - `src/context/AuthContext.tsx` uses Clerk hooks as the source of truth for auth state.
  - Security/account screens still call Supabase auth operations and use mock session counts.
- Recommendation: Consolidate all auth-sensitive account actions on the real identity provider path. Remove or hide any setting that is not actually enforced end to end.

### 2. Two-factor authentication is a simulated UI flow
- Area: Auth / Security
- Files: `src/app/account/two-factor-auth.tsx`, `src/app/account/security.tsx`
- Impact: This creates a false sense of security and is worse than not offering 2FA at all.
- Evidence:
  - SMS send is explicitly TODO and mocked with `setTimeout`.
  - Verification is explicitly TODO and mocked with `setTimeout`.
  - The flow writes `security_settings.two_factor_enabled` to the profile without real factor enrollment or verification.
  - The screen also includes a mock QR placeholder/setup path.
- Recommendation: Remove the feature from production until it is enforced server-side by the real auth provider, or complete it properly with verified factor enrollment and challenge validation.

### 3. Delete-account does not actually delete the account
- Area: Privacy / Compliance
- Files: `src/app/account/delete-account.tsx`
- Impact: The UI promises permanent deletion while only soft-marking a profile row and signing the user out.
- Evidence:
  - The flow updates `profiles.deleted_at`.
  - There is no Clerk user deletion, no data purge, and no cascade cleanup for trips, community content, or linked records.
- Recommendation: Replace this with a real deletion workflow or hide it until legal/privacy expectations are truly met.

### 4. Trip import OAuth/account linking is still placeholder code
- Area: Trip Import / Data Integrity
- Files: `src/services/trip/trip-import.service.ts`
- Impact: Imported trip/account connections are not trustworthy, and token handling is not production-safe.
- Evidence:
  - `exchangeOAuthCode()` returns `mock_access_token`.
  - `getOAuthAccountInfo()` returns `mock_account_id`.
  - `fetchProviderBookings()` returns an empty array.
  - `encryptToken()` is just base64 with a comment saying production should use proper encryption.
- Recommendation: Do not expose provider import until real OAuth exchange, account lookup, booking sync, and secure token storage are complete.

### 5. Community DM routing can use invalid conversation identifiers
- Area: Connect / Community Messaging
- Files: `src/features/community/screens/BuddyProfileScreen.tsx`, `src/features/community/screens/TravelerProfileScreen.tsx`, `src/features/community/screens/GuideProfileScreen.tsx`, `src/features/community/screens/ChatScreen.tsx`, `src/services/community/chat.service.ts`
- Impact: Direct messages can fail to load or attempt to write messages against the wrong record type.
- Evidence:
  - Profile screens route to `/community/chat/${userId}`.
  - Chat handling expects a conversation/chat-room identifier.
  - Message persistence uses that raw value as `conversation_id`.
- Recommendation: Introduce a clear "ensure conversation exists" step and never route directly with a user ID into a conversation screen unless the screen explicitly supports that contract.

### 6. Public edge functions expose privileged or billable behavior without visible caller enforcement
- Area: Backend / Abuse Prevention
- Files: `supabase/functions/ai-vision/index.ts`, `supabase/functions/send-crash-report/index.ts`, `supabase/functions/send-notification/index.ts`
- Impact: These endpoints can be abused for cost, spam, or privileged side effects.
- Evidence:
  - Functions accept requests after basic parsing.
  - CORS is permissive with `Access-Control-Allow-Origin: *`.
  - No visible caller identity, role, or rate-limit validation appears in the function code.
- Recommendation: Require authenticated callers, verify roles where needed, add rate limiting, and log/deny invalid use. Treat these as public attack surfaces.

### 7. AI Vision still calls Google Vision and translation APIs from the client with a public Expo key
- Area: AI / Cost / Secret Hygiene
- Files: `src/features/ar-navigation/services/vision.service.ts`, `src/features/ar-navigation/services/translation.service.ts`, `src/features/ar-navigation/plugins/ai-vision/hooks/useVisionOCR.ts`, `src/features/ar-navigation/plugins/ai-vision/hooks/useTranslation.ts`
- Impact: A public mobile-bundled key can be extracted and abused for billable API usage.
- Evidence:
  - `src/features/ar-navigation/services/vision.service.ts` uses `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`.
  - Calls are made directly from the client to Google endpoints using `?key=...`.
- Recommendation: Move all billable AI/OCR/translation calls behind authenticated server-side proxies.

### 8. SOS/emergency notifications call a function contract that does not match the actual edge function
- Area: Safety / Notifications
- Files: `src/services/realtime/sos/sos.service.ts`, `supabase/functions/send-notification/index.ts`
- Impact: Emergency contact notifications may silently fail during a real incident.
- Evidence:
  - `sos.service.ts` invokes `send-notification` with bodies like `{ type: 'sms' | 'email', to, subject, body }`.
  - `send-notification` is implemented around actions like `dispatch_pending`, `send_single`, and `send_to_user`, and is structured for push/alerts processing instead.
- Recommendation: Fix this contract before launch and test the full SOS path end to end, including actual contact delivery.

## High Findings

### 9. Community notification deep links point to dead or mismatched routes
- Area: Connect / Notifications
- Files: `src/services/notifications/community-notifications.ts`, `src/app/community/[id].tsx`, `src/app/community/event/[id].tsx`, `src/app/community/buddy/[id].tsx`
- Impact: Tapping community notifications can dump users into broken navigation paths.
- Recommendation: Align all generated URLs with real app routes and add integration tests for notification deep links.

### 10. Community members/admin surfaces still use mock or incomplete behavior
- Area: Connect / Community
- Files: `src/features/community/components/feed/MembersTab.tsx`, `src/features/community/screens/GroupAdminScreen.tsx`, `src/features/community/screens/CommunityDetailScreen.tsx`
- Impact: Group trust, moderation, and membership visibility are not reliable.
- Evidence:
  - `MembersTab` ignores the incoming `members` prop and renders `MOCK_MEMBERS`.
  - Admin toggles/settings are incomplete.
  - Group detail state assumes the viewer is a member.
- Recommendation: Replace all community membership/admin placeholders with real data and permission checks before public use.

### 11. Event creation and notification flow is incomplete
- Area: Connect / Events
- Files: `src/features/community/screens/CreateEventScreen.tsx`, `src/services/community/event.service.ts`, `src/services/notifications/community-notifications.ts`
- Impact: Events can be saved with wrong timing data and promised notifications may never send.
- Recommendation: Normalize date and time handling, wire notification triggers, and verify RSVP reminder behavior.

### 12. Manual trip import flow is effectively simulated
- Area: Trips / Import
- Files: `src/features/trip-import/steps/manual/ManualFetchingStep.tsx`, `src/features/trip-import/steps/manual/ManualResultStep.tsx`, `src/features/trip-import/steps/manual/ManualSuccessStep.tsx`, `src/features/trip-import/components/ImportTripFlow.tsx`
- Impact: Users can think a booking or trip was truly imported when the flow only simulates lookup/success.
- Recommendation: Gate the feature until provider-backed import exists or relabel it honestly as manual trip entry.

### 13. Departure Advisor can fall back to fabricated travel guidance
- Area: Trips / Advisory
- Files: `src/features/trips/components/DepartureAdvisor/DepartureAdvisorSheet.tsx`
- Impact: Fabricated timing guidance can cause missed flights or dangerous trust erosion.
- Recommendation: If backend data is unavailable, show a clear unavailable state instead of synthetic estimates.

### 14. Package booking flow is not a real package flow yet
- Area: Booking / Checkout
- Files: `src/features/booking/flows/package/screens/PackageBuildScreen.tsx`, `src/features/booking/flows/package/components/BundleCart.tsx`
- Impact: Users are shown a package flow that still contains TODO actions and hard-coded provider assumptions.
- Recommendation: Hide package booking from production navigation until it has a real selection and checkout path.

### 15. Notification infrastructure is split across multiple incompatible models
- Area: Notifications / Infrastructure
- Files: `src/services/notifications/notificationService.ts`, `src/hooks/useNotifications.ts`, `supabase/functions/send-notification/index.ts`, `src/app/notifications/index.tsx`
- Impact: Delivery state, unread counts, and notification-center rendering can disagree with each other.
- Recommendation: Standardize on one schema and one status lifecycle for in-app and push notifications.

### 16. Navigation is exposed as production functionality while step progression/reroute logic is incomplete
- Area: Navigation
- Files: `src/features/navigation/hooks/useOutdoorNavigation.ts`, `src/features/navigation/MapScreen.tsx`, `src/features/navigation/index.ts`
- Impact: Turn-by-turn directions can stall, mislead, or never reroute correctly.
- Recommendation: Hide incomplete navigation modes and validate maneuver progression against live GPS distance to maneuvers, not static step state.

### 17. Safety flow hard-codes U.S.-specific emergency assumptions
- Area: Safety
- Files: `src/features/ar-navigation/plugins/danger-alerts/components/DangerAlertsOverlay.tsx`, `src/features/ar-navigation/plugins/danger-alerts/data/mockDangerData.ts`, `src/features/ar-navigation/plugins/danger-alerts/hooks/useDangerAlerts.ts`
- Impact: A travel app cannot hard-code `911` or seeded emergency contacts globally without risking dangerous behavior abroad.
- Recommendation: Use country-aware emergency handling and never ship demo emergency contacts.

## Medium Findings

### 18. Duplicate theme systems exist, and one legacy provider behaves differently
- Area: Design System / Architecture
- Files: `src/context/ThemeContext.tsx`, `src/contexts/ThemeContext.tsx`
- Impact: Late-stage theming fixes are risky because two theme contracts still exist.
- Evidence:
  - The canonical provider supports light/dark/system behavior.
  - The legacy provider is marked "legacy" and still forces `isDark = true`.
- Recommendation: Remove or fully quarantine the legacy provider and migrate all imports to one source.

### 19. Hard-coded colors and visual tokens are widespread across production surfaces
- Area: Design System / UI Consistency
- Files: representative examples include `src/features/navigation/MapScreen.tsx`, `src/features/ar-navigation/plugins/ai-vision/components/LiveCameraMode.tsx`, `src/features/ar-navigation/plugins/ai-vision/components/SnapshotMode.tsx`, `src/features/community/components/feed/GroupHeader.tsx`, `src/features/booking/shared/components/ExperienceCard.tsx`, `src/app/deals/saved.tsx`, `src/app/local-experiences/view-all.tsx`
- Impact: Light/dark mode consistency, accessibility, and brand governance are harder to guarantee.
- Evidence:
  - Repo-wide scan surfaced hard-coded hex/RGBA usage across many app, feature, and component files.
  - Newer AI/navigation surfaces are especially heavy on direct literals such as `#FFFFFF`, `#3FC39E`, `#EF4444`, and ad hoc `rgba(...)` overlays.
- Recommendation: Run a dedicated theming pass before launch, starting with user-facing launch surfaces and any account/security screens.

### 20. TODO and placeholder debt is still visible in user flows
- Area: Cross-cutting
- Files: representative examples include `src/app/account/two-factor-auth.tsx`, `src/app/account/active-sessions.tsx`, `src/features/ar-navigation/hooks/useARCamera.ts`, `src/features/ar-navigation/hooks/useARLocation.ts`, `src/features/ar-navigation/plugins/city-navigator/components/DirectionsSheet.tsx`, `src/features/trips/plugins/dos-donts/screens/DosDontsScreen.tsx`
- Impact: Users can reach incomplete experiences that look shippable.
- Recommendation: Convert visible TODO surfaces into one of three states only: completed, hidden, or explicitly disabled with non-deceptive copy.

### 21. Mock data remains embedded in live feature modules
- Area: Cross-cutting / Data Integrity
- Files: `src/features/community/index.ts`, `src/features/community/data/mockData.ts`, `src/features/community/data/feedMockData.ts`, `src/features/community/data/guideMockData.ts`, `src/services/search.service.ts`, `src/features/planning/services/aiService.ts`, `src/features/booking/data/airports.ts`, `src/features/booking/data/destinations.ts`
- Impact: It increases the chance of sample content leaking into production and makes real-data bugs harder to spot.
- Recommendation: Remove mock exports from production indexes and clearly isolate development-only fixtures.

### 22. Logging is too noisy in sensitive flows
- Area: Observability / Privacy
- Files: `src/context/AuthContext.tsx`, `src/app/(auth)/landing.tsx`, `src/app/(auth)/verify-otp.tsx`, `src/hooks/useNotifications.ts`, various community screens
- Impact: Device logs and crash reports can capture auth state, user identifiers, and noisy runtime details.
- Recommendation: Replace `console.*` debugging in auth/community/notifications with redacted production logging.

### 23. Error handling sometimes overstates success or exposes internals
- Area: Error Handling / Trust
- Files: `src/components/common/error/ErrorBoundary.tsx`, `supabase/functions/send-crash-report/index.ts`
- Impact: Users may be told something was reported when it was not, and internal details may be shown too freely.
- Recommendation: Show user-safe fallback copy only, and only mark crash/report submission as successful when confirmed.

### 24. Search and booking flows sometimes mask outages as empty results
- Area: Booking / Search Reliability
- Files: `src/features/booking/flows/car/screens/CarSearchLoadingScreen.tsx`, `src/features/booking/flows/experience/screens/ExperienceSearchLoadingScreen.tsx`, `src/features/booking/flows/hotel/screens/HotelSearchLoadingScreen.tsx`
- Impact: Provider failures look like valid "no inventory" states, making incidents harder to detect and eroding trust.
- Recommendation: Distinguish "no results" from "search failed" in the UI and analytics.

### 25. Notification permission recovery is broken
- Area: Notifications UX
- Files: `src/components/settings/NotificationPreferencesCard.tsx`
- Impact: Users who denied notifications once may not be able to recover from within the app.
- Recommendation: Replace the broken action with a real open-settings flow.

## Low Findings

### 26. Dead or misleading support modules remain in the codebase
- Area: Cleanup / Maintainability
- Files: `src/hooks/useAuth.ts`, `src/config/supabase.config.ts`, `src/lib/notifications/pushNotifications.ts`, `src/lib/notifications/localNotifications.ts`
- Impact: These raise regression risk during last-minute fixes because they imply parallel systems that are not truly in use.
- Recommendation: Remove or clearly mark unused compatibility layers and empty modules.

### 27. Some fallback media and placeholder assets are still visible
- Area: UI Polish / Trust
- Files: `src/features/booking/flows/hotel/components/HotelCard.tsx`, `src/features/booking/flows/hotel/sheets/RoomDetailSheet.tsx`
- Impact: `via.placeholder.com`-style fallbacks reduce polish and trust in real inventory.
- Recommendation: Use branded local fallbacks or hide missing media more gracefully.

### 28. Community and home modules still export or depend on development-oriented sample content
- Area: Cleanup / Bundle Hygiene
- Files: `src/features/community/index.ts`, `src/features/community/components/DiscoverTabContent.tsx`, several homepage section components with fallback mock comments
- Impact: This is not the highest launch risk, but it expands the amount of untrusted behavior in production code.
- Recommendation: Strip development-only exports and isolate editorial/demo content behind explicit flags.

## Theming and Design-System Notes
This app clearly has a team design system, but enforcement is incomplete.

Key design-system concerns:
- There are still two theme contexts in the repo.
- Newer features bypass token usage more often than older/shared surfaces.
- Account/security screens, community hero surfaces, AI Vision, navigation, deals, and local experiences show repeated direct color literals.
- Some screens mix theme tokens with static `colors.gray*`, hard-coded white/black, or direct `rgba(...)` overlays.

Recommended theming sequence:
1. Account/security/auth surfaces
2. Navigation and AI Vision
3. Community/connect
4. Deals, local experiences, and booking cards

## Feature Status Notes
These features should be considered incomplete or not launch-safe in their current form:
- Two-factor auth
- Delete account
- Trusted traveler verification
- Active sessions / logout-all
- Provider trip import
- Manual import success flow
- Departure Advisor fallback mode
- Package booking
- Community DM routing
- Community member/admin tooling
- Some event creation/reminder wiring
- Airport navigation / certain AR city-navigation surfaces
- SOS notification pipeline

## Recommended Release Strategy
For a waitlist launch, the safest path is:

1. Hide or disable every feature listed in "Launch Blockers" until the underlying implementation is real.
2. Fix the auth/security/account-deletion set first.
3. Fix notification model consistency and community deep links second.
4. Lock down edge functions and remove client-side billable AI calls third.
5. Run a focused theme/token cleanup pass on user-facing launch surfaces fourth.
6. Re-test all hidden-vs-enabled feature gates before sending the waitlist email.

## Suggested Tracking Labels
Use these labels when turning this document into tickets:
- `launch-blocker`
- `security`
- `privacy`
- `data-integrity`
- `mock-data`
- `theme-system`
- `dead-code`
- `infra`
- `notifications`
- `community`
- `booking`
- `navigation`

## Final Verdict
Do not treat the current build as fully production-ready for a broad launch.

The app is close enough that a contained launch is realistic, but only if the misleading security/account flows, mock-backed trip/community behaviors, and exposed edge-function/client-AI paths are addressed or gated off first.
