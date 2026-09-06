# Day Excel import — user guide

In-app help: **Help → Day Excel import** (`#help-day-import`). Screen: **Reception → Day Excel import** (`/reception/import`).

## Purpose

One `.xlsx` file = one calendar day (`ImportMeta.businessDate`). Load masters, receptions, QC, payments, oil/container sales and expenses with a **dry-run** report before **commit**.

## Operator steps

1. Download the blank **template** or **sample** from the wizard.
2. Set `ImportMeta.businessDate` (`yyyy-MM-dd`).
3. Fill linked sheets (Regions, Parcels, SupplierTypes, QcRules, Suppliers, OilContainers, StorageUnits, Receptions, QcResults, Payments, OilSales, OilSaleContainers, Expenses). Prefer Excel dropdowns.
4. Upload → **Dry-run** → fix ERROR rows → dry-run again until ready.
5. **Commit** only with zero ERROR rows. Re-import is safe: duplicates are skipped.

## Rules

- Existing masters are **linked only** (never overwritten from the sheet).
- Missing names are **created**.
- Receptions / sales / expenses use import keys; already imported rows → skip (no double stock or finance).
- Stock: priced OIL reception + tank → IN; oil sale → OUT (containers reduce `stockQuantity`).

## Google Drive (optional)

1. **Connect** Google Drive on the wizard (tenant OAuth).
2. Enable tenant params `IMPORT_GDRIVE_ENABLED` and `IMPORT_GDRIVE_FOLDER_ID`.
3. Drop `oosm-import-YYYY-MM-DD.xlsx` into the folder → **Sync now** (or scheduled job).
4. Success → `processed/`; failed dry-run → `failed/`.

## Related

- Backend smoke checklist: `modules/production/src/main/resources/dayimport/SMOKE_CHECKLIST.md` (BE repo).
- i18n keys: `USER_GUIDE.DAY_IMPORT.*`, `ABIOOC.DAY_IMPORT.*`.
