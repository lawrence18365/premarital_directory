-- Fix incorrect benefit data for Maryland and Florida
-- Maryland: fee varies by county (no fixed amounts), waiting period NOT waived by counseling
-- Florida: savings_amount was wrong ($25 shown vs actual $32.50 = $93.50 - $61.00)

-- ── Maryland ─────────────────────────────────────────────────────────────────
-- Source: MD Family Law § 2-404.1
-- Facts: discount amount is SET BY COUNTY (not a statewide fixed amount),
--        48-hr waiting period requires a court order to waive — NOT tied to counseling

UPDATE public.jurisdiction_benefits
SET
  -- Null out fixed fees — they vary by county
  license_fee_cents           = NULL,
  discounted_fee_cents        = NULL,
  -- savings_amount_cents is GENERATED from the two above, will auto-null

  fee_varies_by_county        = true,
  fee_notes                   = 'Marriage license fees and discount amounts are set by each county. Contact your local circuit court clerk for exact figures.',

  -- Waiting period is NOT waived by counseling
  waiting_period_waived       = false,
  standard_waiting_period_hours = 48,

  -- Remove waiting_period_waiver from benefit types
  benefit_types               = ARRAY['discount'],

  summary_text                = 'Maryland law (§ 2-404.1) allows counties to offer a marriage license fee discount for couples who complete at least 4 hours of premarital counseling within 1 year of applying. The discount amount is set by each county — contact your local circuit court clerk for the exact figure. The 48-hour waiting period is a statewide rule and is not waived by completing counseling.',

  -- Keep verified but note the correction
  change_log = change_log || jsonb_build_array(
    jsonb_build_object(
      'changed_at', now(),
      'changed_by', 'migration:fix_maryland_florida_benefit_data',
      'note', 'Corrected: removed false waiting-period-waiver claim; nulled county-variable fees'
    )
  )
WHERE jurisdiction_id = 'maryland';

-- ── Florida ───────────────────────────────────────────────────────────────────
-- The seed had license_fee_cents=9350, discounted_fee_cents=6100.
-- savings_amount_cents (generated) = 9350 - 6100 = 3250 = $32.50.
-- Page was showing $25.00 — likely the DB has stale/different values.
-- Explicitly set to correct values per FL Statute § 741.0305.

UPDATE public.jurisdiction_benefits
SET
  license_fee_cents     = 9350,   -- $93.50
  discounted_fee_cents  = 6100,   -- $61.00  (saves $32.50)
  -- savings_amount_cents auto-computed: 9350 - 6100 = 3250 = $32.50

  summary_text = 'Florida couples who complete a 4-hour premarital course (FL Statute § 741.0305) save $32.50 on their marriage license fee ($93.50 → $61.00) and have the 3-day waiting period waived.',

  change_log = change_log || jsonb_build_array(
    jsonb_build_object(
      'changed_at', now(),
      'changed_by', 'migration:fix_maryland_florida_benefit_data',
      'note', 'Corrected fee values to ensure savings_amount_cents = $32.50'
    )
  )
WHERE jurisdiction_id = 'florida';
