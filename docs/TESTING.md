# TESTING.md — Acceptance matrix & test plan

Automated: backend integration tests (Supertest against a test DB, migrations applied, DB truncated between tests) + unit tests (state machine, validators, voucher number, file type detection). Frontend: tests for ProtectedRoute/RoleRoute, VoucherForm validation, filter→URL sync.

## A. Authentication & routing
1. Valid login for each of 3 roles returns token + role-correct redirect.
2. Wrong password / unknown email → 401 same message. 11th rapid attempt → 429.
3. No token / malformed / expired token → 401 on any protected API; UI redirects to login.
4. Employee opens `/director/*` or `/accounts/*` → 403 page; Director opens `/employee/vouchers/new` → 403 page.
5. Page reload keeps session; logout clears it and back button doesn't reveal data.

## B. Employee
6. Create valid draft → 201, status DRAFT, number `VCH-YYYY-NNNNNN`, voucherDate = today, employee snapshot set.
7. Two parallel creates → distinct numbers (concurrency test).
8. Create with missing department / title / date / amount; amount 0, negative, `abc`, 3 decimals, > max; future expense date → 422 each with field-level details.
9. Client-supplied `status`, `voucherNumber`, `employeeId` ignored.
10. Edit draft ok; delete draft ok (file removed).
11. Submit without signature → 422 `SIGNATURE_REQUIRED`; with signature → PENDING_APPROVAL; history has two rows (SUBMITTED, PENDING_APPROVAL).
12. Submit using saved profile signature copies to voucher.
13. After submit: PUT, DELETE, signature upload, re-submit → 409 for each of SUBMITTED/PENDING/APPROVED/REJECTED.
14. Employee A GET/PUT/DELETE/submit/signature of Employee B's voucher → 404; list never contains B's vouchers; filters can't bypass (`employeeName=B`).
15. Employee approve/reject → 403.
16. Rejected voucher shows reason to the employee; remains read-only.
17. Upload: .svg, .gif, .pdf, renamed .exe→.png (bad magic), > 2 MB → 415/413 with proper codes.

## C. Director
18. List returns all submitted vouchers across employees; drafts hidden by default, visible with `REVIEWERS_SEE_DRAFTS=true`.
19. `/vouchers/pending` returns only PENDING_APPROVAL.
20. Approve with signature → APPROVED, director snapshot, approval date set, history row; without signature → 422.
21. Approve using saved signature works; without saved one → 422.
22. Reject with reason → REJECTED + reason; missing/blank/too short → 422.
23. Approve/reject a DRAFT, APPROVED, REJECTED → 409.
24. Concurrent double-approve → exactly one succeeds, other 409.
25. Director PUT/DELETE/create voucher → 403. Employee-entered fields unchanged after approval.

## D. Accounts
26. Sees all vouchers; can view employee+director signature images; cannot create/edit/delete/approve/reject (403 each).
27. Search/filter/sort works (below). Print view renders and prints cleanly.

## E. Search / filter / sort (each role in scope)
28. voucherNumber partial; employeeName partial case-insensitive; department; category; status (single + multi); date range (inclusive, both dateFields); amount range; combined filters; invalid ranges → 422; sort each whitelisted field both directions; invalid `sortBy` → 422; pagination meta correct; `%` and `_` in search treated literally; SQL-injection strings harmless.

## F. Dashboards
29. Employee counts/amount match DB for own vouchers only.
30. Director pending count/amount, approved-today / rejected-today (timezone boundary test), recent activity ordering.
31. Accounts totals, approved amount, recent approved ordering.

## G. Data integrity (DB level)
32. Direct SQL: update to APPROVED without director signature → CHECK violation; REJECTED without reason → violation; non-draft without employee signature → violation; amount ≤ 0 → violation; duplicate voucher_number → violation.

## H. UI / responsive / accessibility
33. 360px, 768px, 1280px layouts: no horizontal scroll, tables collapse to cards, dialogs usable.
34. Keyboard-only: complete login → create → submit; focus visible; dialog focus trap.
35. Loading, empty, and error states visible for each list/dashboard (throttle/offline test).
36. Signature images load for authorized users; direct URL without token → 401; other employee → 404.

## I. Final manual smoke script (record result in README "Verification")
Login Emma → create voucher → upload signature → save draft → edit → submit → login Director → see in Pending → approve with signature → login Accounts → see Approved in dashboard + list → open details → view both signatures → print. Repeat with reject and confirm Emma sees reason. Confirm Ethan can't see Emma's vouchers.
