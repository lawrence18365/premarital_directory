-- Florida fee correction: the $32.50 discount is fixed by statute (§ 741.0305),
-- but the base fee varies by county ($86–$93.50 depending on clerk add-ons).
-- Showing $93.50 as a single "standard fee" can mismatch what users see at their
-- county clerk. Update to reflect the variance clearly.

UPDATE public.jurisdiction_benefits
SET
  -- Null the base fee — too variable to pin to one number
  license_fee_cents     = NULL,
  -- Discounted fee of $61 is consistently cited by most county clerks
  discounted_fee_cents  = 6100,
  -- savings_amount_cents is generated: will be NULL when license_fee_cents is NULL.
  -- We store it explicitly via savings_amount_override instead.
  -- Since it's a generated column we can't override it; use fee_notes to communicate.

  fee_varies_by_county  = true,
  fee_notes             = 'Base fee varies by county ($86–$93.50 depending on clerk add-ons). The $32.50 discount is set by FL § 741.0305 and is universal. Most clerks list the post-discount fee as $61.00. Confirm exact totals with your county clerk.',

  -- Waiting period note: residents only
  summary_text = 'Florida Statute § 741.0305 reduces the marriage license fee by $32.50 when couples present a valid premarital course certificate (4 hours minimum from a registered provider). For Florida residents, the 3-day waiting period is also waived. Non-residents are already exempt from the waiting period. Base fee varies by county; most clerks list $61.00 after the discount.',

  change_log = change_log || jsonb_build_array(
    jsonb_build_object(
      'changed_at', now(),
      'changed_by', 'migration:fix_florida_fee_variance',
      'note', 'Nulled fixed base fee (county-variable); discounted fee stays $61; added resident-only waiting period note'
    )
  )
WHERE jurisdiction_id = 'florida';
