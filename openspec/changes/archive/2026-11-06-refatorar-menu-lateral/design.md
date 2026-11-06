# Design

## Context

See `proposal.md` for the motivation and `specs/application-shell-baseline/spec.md` for the behavior contract. The current `AppLayout` composes a fixed horizontal `Header` and a separate full-screen `MenuMobile`; their navigation lists are not shared and neither has direct test coverage. The existing compact-menu breakpoint is `981px`.

## Goals / Non-Goals

**Goals:**

- Establish one navigation definition and one lateral visual composition for every internal route.
- Reproduce the functional hierarchy of the approved reference: brand header, icon-led vertical links, clear active state, unavailable entries and a non-interactive informational card.
- Keep the compact experience keyboard-operable and restore focus predictably after closing the panel.

**Non-Goals:**

- Build the unavailable product areas or add their routes.
- Redesign the internals of appointment, patient, professional or configuration pages.
- Add a new dependency, persist sidebar state, or introduce server-driven clinic branding.

## Decisions

### One navigation model drives both breakpoints

Create a single typed collection of menu entries owned by the new shared lateral-navigation component. Each entry declares its label, icon, target (when available) and availability state; it is rendered as a route link or an unavailable control from the same collection.

This prevents the current divergence between `Header` and `MenuMobile` and makes the “Em breve” treatment explicit. Keeping two independently maintained lists was considered and rejected because route, label and accessibility changes could become inconsistent.

### The layout owns responsive panel state

`AppLayout` will compose the sidebar and outlet in a shared shell. At `981px` and above, the sidebar is a persistent landmark beside the outlet. Below that breakpoint, the same navigation is an off-canvas lateral dialog opened by a labelled trigger; opening it prevents background scrolling, Escape and the close control dismiss it, and focus returns to the trigger.

This retains the existing responsive threshold and its escape/scroll protection while changing the compact presentation from full-screen center content to the supplied lateral composition. A permanently visible narrow sidebar on compact screens was rejected because it would reduce the usable space of the agenda and patient screens.

### Route and unavailable states are semantic

Available entries use route-aware navigation so the current destination receives a visual selected state and `aria-current`. Services, Reports and Finance render with visible “Em breve” text and `aria-disabled`; they do not receive a route. When activated through a pointer or keyboard, they keep the current location and expose their unavailable status without invoking a domain action.

Using a native disabled element alone was rejected because it cannot provide a focused interaction/status path for keyboard users. Creating placeholder routes was rejected because it would misrepresent an unimplemented product area as delivered.

### Reference visuals are contained in the navigation boundary

The new component owns the dark-green lateral surface, clinic identity area, icon alignment, green active treatment and bottom informational card. The card's arrow is decorative in this change. Existing local brand assets may be used only when they match the approved identity and have their origin/consumer documented; otherwise the existing approved product assets remain the source of truth.

The legacy horizontal navigation and its menu-only dropdown content will be removed from the internal shell after the new sidebar replaces their behavior. The placeholder layout footer is also removed or relocated only if needed to avoid competing with the sidebar card.

## Risks / Trade-offs

- [Large pages may assume a fixed top header] → Verify the agenda and patient screens at wide and compact sizes; adjust shell spacing rather than individual page behavior where possible.
- [An off-canvas panel can leak focus or scroll] → Add focused component tests for opening, closing, Escape, focus return and body-scroll restoration.
- [The visual reference has items without delivered routes] → Preserve the visible entries but make their unavailable state explicit and test that the URL does not change.
- [Brand asset provenance is unclear] → Reuse only repository assets with documented origin or request a supplied approved asset before adding one.

## Migration Plan

1. Add the shared sidebar and its navigation model while retaining the established route paths.
2. Update `AppLayout` to use the new shell and remove the legacy `Header`/`MenuMobile` composition once the sidebar covers both breakpoints.
3. Add component-level interaction and responsive-layout tests, then run lint, the focused tests and build; record the known baseline build failure separately if it remains unrelated.
4. Roll back by restoring the prior layout composition; no database, API, route or persisted-state migration is required.
