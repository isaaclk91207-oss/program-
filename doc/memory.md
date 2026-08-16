# Project Memory & Clarifications — PCCP Demo Prototype

Living notes so the assistant remembers key decisions for the PCCP driver/fleet
management demo (single-file React + Tailwind prototype, no backend API).

## CRITICAL CLARIFICATION (driver/passenger lists = AUTH)
- The **driver list** and **passenger list** are the **authentication (login/select)
  screens**. Selecting a user from those lists IS how you "log in" as that
  driver/passenger.
- Therefore: do NOT treat the driver/passenger lists as read-only admin directories.
  The parenthetical "where select driver list and passenger list" in the admin-nav
  request referred to this AUTH flow, not an admin management view.
- The **Quick Role Switcher** (top bar) swaps roles. For Driver/Passenger it routes
  to the respective AUTH list (DriverUserSelector / PassengerUserSelector) so the
  user picks an account — it does NOT auto-log-in a fixed user.
- Fixed demo users live INSIDE those auth lists:
  - Admin = System Admin
  - Driver = Ko Maung (DRV-001)
  - Passenger = Daw Thin Thin (PAS-00118)

## Confirmed scope (phased)
- A (driver QR): driver "QR" tab shows the **Car / Vehicle QR** (assigned vehicle
  plate, e.g. YGN-3312), not the driver-identity QR.
- B (admin nav): was initially built as a read-only Passengers directory, but that
  was a MISREAD of the auth clarification. Decide with user whether to keep /
  replace-with-act-as-shortcuts / remove.
- C (cancel transport request): explicitly DEFERRED by user ("implement A and B
  only"). Not built. If added later: Admin + Passenger can cancel; driver views
  only. Add CANCELLED status + cancel flow + notify other party.

## Architecture facts
- Single file: pccp-prototype.jsx (~5130+ lines). Build: `npm run build` (Vite).
- State in root App; persisted to localStorage (STORAGE_KEY="pccp-state") with
  id-merge on write + 1s polling + storage-event sync (cross-tab, no clobber).
- Notifications carry recipientId + recipientRole; separated per role; bell badge
  reflects unread per role; clicking marks read.
- Files: doc/userflow.md (Phase 1 user flow).
