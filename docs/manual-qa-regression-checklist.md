# Manual QA Regression Checklist

Use this document to validate the current frontend and backend changes against the previous implementation.

## Execution record

| Field | Value |
|---|---|
| Tester | |
| Environment | |
| Frontend commit | |
| Backend commit | |
| Browser/device | |
| Tenant | |
| Test date | |

Status values: `NOT TESTED`, `PASS`, `FAIL`, `BLOCKED`, `NOT APPLICABLE`.

For every failure, record the actual result, evidence, affected record IDs, and defect reference. Never include passwords or access tokens.

## 1. Supplier payments

| ID | Scenario | Expected result | Status | Evidence / defect |
|---|---|---|---|---|
| PAY-001 | Open payment from an unpaid row | Dialog uses the selected row ID, price, paid amount, and unpaid amount | NOT TESTED | |
| PAY-002 | Open payment after sorting the table | Selected row remains correct | NOT TESTED | |
| PAY-003 | Open payment after filtering the table | Selected row remains correct | NOT TESTED | |
| PAY-004 | Open payment from another pagination page | Selected row remains correct | NOT TESTED | |
| PAY-005 | Submit a partial cash payment | Paid amount increases, unpaid amount decreases, status becomes partially paid | NOT TESTED | |
| PAY-006 | Pay the remaining cash balance | Unpaid amount becomes zero and status becomes paid | NOT TESTED | |
| PAY-007 | Pay by cheque | Cheque number is required and retained on the transaction | NOT TESTED | |
| PAY-008 | Pay by bank transfer | Bank account is required and retained on the transaction | NOT TESTED | |
| PAY-009 | Submit an oil-only payment equal to the balance | Delivery becomes paid and an oil payment transaction is created | NOT TESTED | |
| PAY-010 | Submit an oil-only partial payment | Delivery remains partially paid with the correct balance | NOT TESTED | |
| PAY-011 | Submit mixed cash and oil payment | Displayed and persisted total equals cash plus oil value | NOT TESTED | |
| PAY-012 | Inspect a saved mixed payment | Cash and oil portions can be reconstructed from persisted data | NOT TESTED | |
| PAY-013 | Use oil worth more than the unpaid balance | Excess value follows the approved rule: reject, adjust quantity, return value, or create credit | NOT TESTED | |
| PAY-014 | Attempt zero payment | Submission is rejected without changing balances | NOT TESTED | |
| PAY-015 | Attempt negative payment | Submission is rejected without changing balances | NOT TESTED | |
| PAY-016 | Attempt monetary overpayment | Applied amount follows the approved overpayment rule | NOT TESTED | |
| PAY-017 | Double-click payment confirmation | Only one payment and one financial transaction are created | NOT TESTED | |
| PAY-018 | Retry after a network timeout | No duplicate payment is created | NOT TESTED | |
| PAY-019 | Process an exchange payment | Correct amount, direction, operation type, and balance are stored | NOT TESTED | |
| PAY-020 | Process a simple-reception cash payment | Correct delivery and balance are updated | NOT TESTED | |
| PAY-021 | Process a simple-reception oil payment | Related oil reception is used and correct delivery is updated | NOT TESTED | |
| PAY-022 | Process a simple-reception mixed payment | Total and remaining balance are correct | NOT TESTED | |
| PAY-023 | View payment on desktop | Cash, oil, and mixed methods are available where valid | NOT TESTED | |
| PAY-024 | View payment on mobile | Methods, amounts, and actions match desktop behavior | NOT TESTED | |

## 2. Payment display and transaction presentation

| ID | Scenario | Expected result | Status | Evidence / defect |
|---|---|---|---|---|
| DSP-001 | Delivery has no payment | Status is unpaid | NOT TESTED | |
| DSP-002 | Delivery has paid and unpaid values above zero | Status is partially paid | NOT TESTED | |
| DSP-003 | Delivery has zero unpaid balance | Status is paid | NOT TESTED | |
| DSP-004 | Legacy delivery has null paid/unpaid values | Page renders without error and status is sensible | NOT TESTED | |
| DSP-005 | Payment completes while list is open | Paid/unpaid values refresh without showing another row's data | NOT TESTED | |
| DSP-006 | View paid/unpaid columns on desktop | Correct values and TND formatting are shown | NOT TESTED | |
| DSP-007 | View paid/unpaid values on mobile | Correct values and layout are shown | NOT TESTED | |
| DSP-008 | View cash, cheque, transfer, oil, and mixed transactions | Correct localized payment method appears | NOT TESTED | |
| DSP-009 | View inbound transaction | Correct inbound icon, color, and tooltip appear | NOT TESTED | |
| DSP-010 | View outbound transaction | Correct outbound icon, color, and tooltip appear | NOT TESTED | |
| DSP-011 | View internal transaction | Correct internal icon, color, and tooltip appear | NOT TESTED | |
| DSP-012 | Switch to Arabic | Direction icons and labels remain correct in RTL | NOT TESTED | |

## 3. Reception creation and lifecycle

| ID | Scenario | Expected result | Status | Evidence / defect |
|---|---|---|---|---|
| REC-001 | Create base trituration | Correct operation type and initial state are stored | NOT TESTED | |
| REC-002 | Create simple reception | Correct operation type and initial state are stored | NOT TESTED | |
| REC-003 | Create exchange reception | Correct operation type and initial state are stored | NOT TESTED | |
| REC-004 | Create olive purchase | Correct operation type and initial state are stored | NOT TESTED | |
| REC-005 | Create oil purchase | Correct operation type and initial state are stored | NOT TESTED | |
| REC-006 | Create direct oil reception | Correct operation type and initial state are stored | NOT TESTED | |
| REC-007 | User has CREATE but not UPDATE | New reception form opens successfully | NOT TESTED | |
| REC-008 | User lacks CREATE | New reception form is denied | NOT TESTED | |
| REC-009 | Navigate to `/new` routes | Router does not interpret `new` as an entity ID | NOT TESTED | |
| REC-010 | User has supplier READ only | Supplier list and details open | NOT TESTED | |
| REC-011 | Cancel a waiting reception | Cancellation succeeds and reason is retained | NOT TESTED | |
| REC-012 | Cancel a controlled reception before downstream work | Cancellation follows the approved state rule | NOT TESTED | |
| REC-013 | Cancel after milling | Cancellation is rejected | NOT TESTED | |
| REC-014 | Cancel after stock movement | Cancellation is rejected | NOT TESTED | |
| REC-015 | Cancel after payment | Cancellation is rejected or safely reversed according to policy | NOT TESTED | |
| REC-016 | Delete a new unused reception | Soft deletion succeeds | NOT TESTED | |
| REC-017 | Delete after payment | Deletion is rejected | NOT TESTED | |
| REC-018 | Delete after stock creation | Deletion is rejected | NOT TESTED | |
| REC-019 | Delete after milling | Deletion is rejected | NOT TESTED | |
| REC-020 | Price eligible olive reception | Price and unpaid balance are initialized correctly | NOT TESTED | |
| REC-021 | Price eligible oil reception | Price and unpaid balance are initialized correctly | NOT TESTED | |
| REC-022 | Reprice after stock/payment processing | Repricing is rejected | NOT TESTED | |
| REC-023 | Apply exchange pricing to non-exchange reception | Request is rejected | NOT TESTED | |
| REC-024 | Create two receptions concurrently | Delivery and lot numbers are unique | NOT TESTED | |
| REC-025 | Create receptions in two tenants | Sequences are isolated by tenant | NOT TESTED | |
| REC-026 | Delete a reception then create another | Deleted sequence is not reused | NOT TESTED | |
| REC-027 | Test year transition | Sequence and lot year follow the approved annual rule | NOT TESTED | |

## 4. Storage, oil transactions, and filtration

| ID | Scenario | Expected result | Status | Evidence / defect |
|---|---|---|---|---|
| STO-001 | Create storage unit | Current volume is zero and cannot be edited | NOT TESTED | |
| STO-002 | Inspect storage create request | Payload contains zero current volume | NOT TESTED | |
| STO-003 | Edit storage metadata | Existing current volume remains unchanged | NOT TESTED | |
| STO-004 | Manipulate storage volume through browser tools | Backend preserves the stored volume | NOT TESTED | |
| STO-005 | Create each oil transaction type | Correct fields are required immediately | NOT TESTED | |
| STO-006 | Change oil transaction type | Required and pricing fields update correctly | NOT TESTED | |
| STO-007 | Update allowed transaction metadata | Update succeeds without changing protected stock effects | NOT TESTED | |
| STO-008 | Attempt cross-tenant oil transaction update | Request is denied or returns not found | NOT TESTED | |
| STO-009 | Delete reversible oil transaction | Stock quantities are restored exactly once | NOT TESTED | |
| STO-010 | Delete transaction with downstream dependency | Deletion is rejected | NOT TESTED | |
| STO-011 | Transfer oil between storage units | Source decreases and destination increases once | NOT TESTED | |
| STO-012 | Transfer more than source quantity | Request is rejected | NOT TESTED | |
| STO-013 | Use same source and destination | Request is rejected | NOT TESTED | |
| STO-014 | Create filtration operation | Input/output quantities and storage balances are correct | NOT TESTED | |
| STO-015 | Edit filtration operation | Balances remain consistent | NOT TESTED | |
| STO-016 | Delete filtration operation | Reversal follows the approved rule | NOT TESTED | |
| STO-017 | View filtration dashboard | Totals match underlying operations | NOT TESTED | |

## 5. Quality control

| ID | Scenario | Expected result | Status | Evidence / defect |
|---|---|---|---|---|
| QC-001 | Numeric value equals minimum | Result passes | NOT TESTED | |
| QC-002 | Numeric value is slightly below minimum | Result fails and cannot be accepted accidentally | NOT TESTED | |
| QC-003 | Numeric value equals maximum | Result passes | NOT TESTED | |
| QC-004 | Numeric value is slightly above maximum | Result fails and cannot be accepted accidentally | NOT TESTED | |
| QC-005 | Numeric value is near decimal tolerance | Result follows configured tolerance | NOT TESTED | |
| QC-006 | Boolean expected true, submitted true | Result passes | NOT TESTED | |
| QC-007 | Boolean expected true, submitted false | Result fails | NOT TESTED | |
| QC-008 | Boolean expected false, submitted false | Result passes | NOT TESTED | |
| QC-009 | Boolean expected false, submitted true | Result fails | NOT TESTED | |
| QC-010 | Submit valid string option | Result passes | NOT TESTED | |
| QC-011 | Submit invalid string option | Result fails | NOT TESTED | |
| QC-012 | Submit string with spaces or case differences | Normalization follows the approved rule | NOT TESTED | |
| QC-013 | READ-only user opens QC rules | List opens | NOT TESTED | |
| QC-014 | CREATE user opens `/settings/quality-control/new` | Create form opens | NOT TESTED | |
| QC-015 | UPDATE user opens existing rule | Edit form opens | NOT TESTED | |
| QC-016 | Unauthorized user opens QC routes | Access is denied | NOT TESTED | |

## 6. Daily import

| ID | Scenario | Expected result | Status | Evidence / defect |
|---|---|---|---|---|
| IMP-001 | Open import without accepting rules | Validation and commit controls remain disabled | NOT TESTED | |
| IMP-002 | Accept import rules | Controls become available | NOT TESTED | |
| IMP-003 | Return as the same user | Acceptance persists | NOT TESTED | |
| IMP-004 | Open as another user | Acceptance does not leak between users | NOT TESTED | |
| IMP-005 | Increase rules version | Previous acceptance is invalidated | NOT TESTED | |
| IMP-006 | Download French template | French sheets, headers, instructions, and dropdowns are correct | NOT TESTED | |
| IMP-007 | Download English template | English sheets, headers, instructions, and dropdowns are correct | NOT TESTED | |
| IMP-008 | Download Arabic template | Arabic sheets, headers, instructions, dropdowns, and direction are correct | NOT TESTED | |
| IMP-009 | Dry-run valid workbook | Preview shows valid rows and allows commit | NOT TESTED | |
| IMP-010 | Dry-run invalid workbook | Errors identify sheet, row, field, and reason | NOT TESTED | |
| IMP-011 | Upload wrong file type | File is rejected | NOT TESTED | |
| IMP-012 | Upload workbook with missing sheet | Dry run fails clearly | NOT TESTED | |
| IMP-013 | Upload duplicate business key | Duplicate is detected | NOT TESTED | |
| IMP-014 | Upload missing reference | Missing relation is reported | NOT TESTED | |
| IMP-015 | Upload invalid dates/numbers | Field errors are reported | NOT TESTED | |
| IMP-016 | Commit valid preview | Records are created once and success is shown | NOT TESTED | |
| IMP-017 | Replace file after preview | Old preview cannot be committed | NOT TESTED | |
| IMP-018 | Commit rejected preview | Success message is not shown | NOT TESTED | |
| IMP-019 | Refresh during commit | No duplicate records are created | NOT TESTED | |
| IMP-020 | Reimport same workbook | Idempotency/duplicate rules are enforced | NOT TESTED | |
| IMP-021 | Download XLSX report | Report opens and contains correct results | NOT TESTED | |
| IMP-022 | Download CSV report | Report contains correct results and encoding | NOT TESTED | |
| IMP-023 | Reconcile imported reception totals | Totals match workbook | NOT TESTED | |
| IMP-024 | Reconcile imported payments | Balances match workbook | NOT TESTED | |
| IMP-025 | Reconcile oil sales, expenses, and storage | Imported records and stock balances match workbook | NOT TESTED | |

## 7. Authentication, permissions, and tenant isolation

| ID | Scenario | Expected result | Status | Evidence / defect |
|---|---|---|---|---|
| AUTH-001 | Cold start on protected deep link | Guard waits for session context and opens authorized page | NOT TESTED | |
| AUTH-002 | Repeat with slow network | No false access-denied page appears | NOT TESTED | |
| AUTH-003 | Refresh response contains modules | Module permissions load correctly | NOT TESTED | |
| AUTH-004 | Refresh omits modules and profile succeeds | Profile fallback loads module permissions | NOT TESTED | |
| AUTH-005 | Refresh and profile both fail | User receives deterministic failure behavior | NOT TESTED | |
| AUTH-006 | OOSM administrator login | Administration access works as designed | NOT TESTED | |
| AUTH-007 | Tenant administrator login | Enabled modules and admin permissions are correct | NOT TESTED | |
| AUTH-008 | Restricted user login | Only assigned permissions are available | NOT TESTED | |
| AUTH-009 | User has no enabled modules | Business modules remain inaccessible | NOT TESTED | |
| AUTH-010 | Locked user login | Login is rejected | NOT TESTED | |
| AUTH-011 | User without tenant login | Access follows explicit platform policy | NOT TESTED | |
| AUTH-012 | Forgot-password request | Reset code flow starts without exposing account existence improperly | NOT TESTED | |
| AUTH-013 | Invalid or expired reset code | Reset is rejected | NOT TESTED | |
| AUTH-014 | Password mismatch | Submission remains blocked | NOT TESTED | |
| AUTH-015 | Successful password reset | Success is shown and login works with new password | NOT TESTED | |
| AUTH-016 | Change current password | User is signed out and stored tokens are cleared | NOT TESTED | |
| AUTH-017 | Access another tenant's delivery ID | Read is denied or returns not found | NOT TESTED | |
| AUTH-018 | Update another tenant's delivery ID | Update is denied or returns not found | NOT TESTED | |
| AUTH-019 | Delete another tenant's delivery ID | Delete is denied or returns not found | NOT TESTED | |
| AUTH-020 | Pay another tenant's delivery ID | Payment is denied or returns not found | NOT TESTED | |
| AUTH-021 | Access another tenant's storage/oil/QC IDs | Every request is denied or returns not found | NOT TESTED | |
| AUTH-022 | Call tenant endpoint without tenant context | Backend fails closed | NOT TESTED | |

## 8. Dashboards and exports

| ID | Scenario | Expected result | Status | Evidence / defect |
|---|---|---|---|---|
| DASH-001 | Open administration dashboard | Company, user, support, and module metrics load | NOT TESTED | |
| DASH-002 | Validate tenant totals | Active/inactive/total counts match database | NOT TESTED | |
| DASH-003 | Validate active users over seven days | Count and company distribution are correct | NOT TESTED | |
| DASH-004 | Validate locked and tenantless users | Counts match user records | NOT TESTED | |
| DASH-005 | Validate support-ticket totals | Open, in-progress, resolved, and closed counts match | NOT TESTED | |
| DASH-006 | Validate module adoption | Tenant counts and percentages are correct | NOT TESTED | |
| DASH-007 | Search companies by name | Correct companies are returned | NOT TESTED | |
| DASH-008 | Search companies by city | Correct companies are returned | NOT TESTED | |
| DASH-009 | Filter active/inactive companies | Correct companies are shown | NOT TESTED | |
| DASH-010 | Use show-more control | Remaining companies appear correctly | NOT TESTED | |
| DASH-011 | Open company details | Correct company opens | NOT TESTED | |
| DASH-012 | Open module management | Correct company and module section open | NOT TESTED | |
| DASH-013 | OOSM administrator dashboard tabs | Only intended platform-administration content appears | NOT TESTED | |
| DASH-014 | Tenant user dashboard tabs | Only enabled and permitted modules appear | NOT TESTED | |
| DASH-015 | Export dashboard | Workbook opens without repair warnings | NOT TESTED | |
| DASH-016 | Validate exported values | Labels, dates, counts, percentages, and empty values are correct | NOT TESTED | |
| DASH-017 | Desktop layout | No clipping, overlap, or inaccessible controls | NOT TESTED | |
| DASH-018 | Tablet layout | No clipping, overlap, or inaccessible controls | NOT TESTED | |
| DASH-019 | Mobile layout | Cards, navigation, and actions remain usable | NOT TESTED | |
| DASH-020 | Arabic RTL layout | Order, icons, values, and alignment are correct | NOT TESTED | |
| DASH-021 | Reduced-motion mode | Nonessential animations are reduced or disabled | NOT TESTED | |
| DASH-022 | Reduced-transparency mode | Content remains readable without transparency effects | NOT TESTED | |

## 9. Tours

| ID | Scenario | Expected result | Status | Evidence / defect |
|---|---|---|---|---|
| TOUR-001 | First eligible login | Tour starts once at the correct page | NOT TESTED | |
| TOUR-002 | Use next/previous controls | Tour moves through correct targets | NOT TESTED | |
| TOUR-003 | Close the tour | Overlay is removed and page controls become usable | NOT TESTED | |
| TOUR-004 | Finish the tour | Completion persists after reload | NOT TESTED | |
| TOUR-005 | Replay current tour | Current page tour restarts | NOT TESTED | |
| TOUR-006 | Restart all tours | All tour completion state is reset | NOT TESTED | |
| TOUR-007 | Navigate while tour is active | Old overlay is destroyed and does not block the destination | NOT TESTED | |
| TOUR-008 | Use keyboard only | Focus, navigation, and close controls work | NOT TESTED | |
| TOUR-009 | Use Escape | Behavior matches accessibility policy | NOT TESTED | |
| TOUR-010 | Enable reduced motion | Tour avoids unnecessary animation | NOT TESTED | |
| TOUR-011 | Use mobile viewport | Popover remains visible and operable | NOT TESTED | |

## 10. Localization

| ID | Scenario | Expected result | Status | Evidence / defect |
|---|---|---|---|---|
| I18N-001 | Search UI for dotted uppercase keys | No raw translation keys are visible | NOT TESTED | |
| I18N-002 | Review `TRANSACTIONS.TYPES.OIL_SALE_PAYMENT` | Correct English, French, and Arabic text appears | NOT TESTED | |
| I18N-003 | Review Arabic generated values | English placeholders such as `TITLE`, `VIEW ALL`, `OPENING`, and `CLOSING` are removed | NOT TESTED | |
| I18N-004 | Review French generated values | Terminology and grammar are correct | NOT TESTED | |
| I18N-005 | Review dialogs and snackbars | Dynamic messages are translated in all languages | NOT TESTED | |
| I18N-006 | Review tooltips and menus | Labels are translated in all languages | NOT TESTED | |
| I18N-007 | Review validation errors | Error messages are translated and understandable | NOT TESTED | |
| I18N-008 | Review exports and reports | Generated documents use the selected language | NOT TESTED | |
| I18N-009 | Review Arabic dates and numbers | Formatting is correct and readable | NOT TESTED | |
| I18N-010 | Review Arabic tables and dialogs | RTL order and alignment are correct | NOT TESTED | |

## 11. Failure handling and compatibility

| ID | Scenario | Expected result | Status | Evidence / defect |
|---|---|---|---|---|
| ERR-001 | API returns 400 | Field/business error is shown without corrupting state | NOT TESTED | |
| ERR-002 | API returns 401 | Session is refreshed or user is returned to login | NOT TESTED | |
| ERR-003 | API returns 403 | Access-denied behavior is clear and stable | NOT TESTED | |
| ERR-004 | API returns 404 | Not-found message appears without exposing another tenant | NOT TESTED | |
| ERR-005 | API returns 409 | Conflict is explained and data can be reloaded | NOT TESTED | |
| ERR-006 | API returns 500 | Error is shown and form data is not lost unexpectedly | NOT TESTED | |
| ERR-007 | Network disconnect during submit | No duplicate record is created after retry | NOT TESTED | |
| ERR-008 | Chrome desktop | Critical flows pass | NOT TESTED | |
| ERR-009 | Edge desktop | Critical flows pass | NOT TESTED | |
| ERR-010 | Mobile Chrome | Critical flows pass | NOT TESTED | |
| ERR-011 | Legacy delivery has inconsistent paid fields | Display and next payment normalize safely | NOT TESTED | |
| ERR-012 | Legacy storage/QC/transaction records | Pages open and updates preserve protected data | NOT TESTED | |

## 12. Release hygiene

| ID | Check | Expected result | Status | Evidence / defect |
|---|---|---|---|---|
| REL-001 | Inspect Git changes | No access tokens, passwords, tenant IDs, or private data are included | NOT TESTED | |
| REL-002 | Inspect backend scripts | Local token and password-reset helper files are excluded | NOT TESTED | |
| REL-003 | Inspect datasource configuration | Local database credentials are excluded | NOT TESTED | |
| REL-004 | Inspect Playwright output | Screenshots, videos, and transient results are excluded unless required | NOT TESTED | |
| REL-005 | Inspect i18n audit output | Only intended reports are committed | NOT TESTED | |
| REL-006 | Run frontend unit suite | Entire current suite passes in one run | NOT TESTED | |
| REL-007 | Run backend reactor suite | Entire current suite passes in one run | NOT TESTED | |
| REL-008 | Run full Playwright suite | All configured tests pass; environment-dependent skips are documented | NOT TESTED | |
| REL-009 | Run production frontend build | Build succeeds and warnings are reviewed | NOT TESTED | |
| REL-010 | Run strict i18n check | Structural check passes and generated fallback translations are manually reviewed | NOT TESTED | |

## Defect log

| Defect ID | QA test ID | Severity | Summary | Reproduction notes | Evidence | Owner | Status |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

## Final sign-off

| Area | Result | Notes |
|---|---|---|
| Supplier payments | NOT TESTED | |
| Reception lifecycle | NOT TESTED | |
| Storage and stock | NOT TESTED | |
| Quality control | NOT TESTED | |
| Daily import | NOT TESTED | |
| Authentication and tenant isolation | NOT TESTED | |
| Dashboards | NOT TESTED | |
| Tours | NOT TESTED | |
| Localization | NOT TESTED | |
| Failure handling | NOT TESTED | |
| Release hygiene | NOT TESTED | |

Release decision: `NOT APPROVED` / `APPROVED WITH CONDITIONS` / `APPROVED`.

Final notes:

- 
