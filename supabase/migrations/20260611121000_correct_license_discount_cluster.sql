-- Correct and expand the state license-discount cluster.
-- Indiana's old discount entry is stale; current Indiana Courts guidance lists
-- standard resident/out-of-state fees and no premarital-course reduction.
-- Utah and West Virginia have real incentives but were only present in the
-- React fallback config, so add DB rows for the public state pages.

UPDATE public.jurisdiction_benefits
SET
  benefit_types = ARRAY[]::TEXT[],
  license_fee_cents = NULL,
  discounted_fee_cents = NULL,
  fee_varies_by_county = false,
  fee_notes = 'Current Indiana Courts public guidance lists $25 for Indiana residents and $65 for out-of-state residents, with no premarital education fee reduction.',
  waiting_period_waived = false,
  standard_waiting_period_hours = NULL,
  waiting_period_reduction_hours = NULL,
  premarital_program_required = false,
  hours_required = NULL,
  accepted_formats = ARRAY[]::TEXT[],
  approved_provider_rules = '{}'::JSONB,
  certificate_fields = '{}'::JSONB,
  submission_process = '{}'::JSONB,
  official_sources = jsonb_build_array(jsonb_build_object(
    'url', 'https://www.in.gov/courts/services/marriage-license/',
    'source_type', 'court_site',
    'title', 'Indiana Judicial Branch: Apply for a Marriage License',
    'retrieved_at', '2026-06-11T00:00:00Z',
    'excerpt', 'The marriage license fee is $25.00 if one or both parties are Indiana residents and $65.00 for out-of-state residents.',
    'fields_supported', ARRAY['license_fee_cents', 'benefit_types']
  )),
  statute_citation = NULL,
  verification_status = 'no_benefit',
  last_verified_at = now(),
  is_indexed = false,
  noindex_reason = 'no_current_direct_license_incentive',
  summary_text = 'Indiana does not currently publish a statewide premarital counseling marriage-license discount. Use the standard Indiana marriage license process and fee guidance.',
  fast_path_text = NULL,
  faqs = '[]'::JSONB,
  change_log = change_log || jsonb_build_array(jsonb_build_object(
    'changed_at', now(),
    'changed_by', 'migration:correct_license_discount_cluster',
    'note', 'De-indexed stale Indiana discount page after current official fee guidance showed no direct premarital-course reduction.'
  ))
WHERE jurisdiction_id = 'indiana';

UPDATE public.jurisdiction_benefits
SET
  license_fee_cents = 12500,
  discounted_fee_cents = 5000,
  waiting_period_waived = false,
  standard_waiting_period_hours = NULL,
  waiting_period_reduction_hours = NULL,
  benefit_types = ARRAY['discount'],
  fee_notes = 'Fees effective July 1, 2025: standard marriage license $125; reduced marriage license with certificate of premarital education $50.',
  summary_text = 'Minnesota couples who complete at least 12 hours of premarital education can reduce the marriage license fee from $125 to $50. Minnesota no longer has a general 5-day waiting period.',
  official_sources = jsonb_build_array(
    jsonb_build_object(
      'url', 'https://www.millelacs.mn.gov/1182/Marriage-Licenses-Certificates',
      'source_type', 'county_clerk_site',
      'title', 'Mille Lacs County Marriage Licenses & Certificates',
      'retrieved_at', '2026-06-11T00:00:00Z',
      'excerpt', 'Marriage License $125. Marriage License with Certificate of Premarital Education $50.',
      'fields_supported', ARRAY['license_fee_cents', 'discounted_fee_cents']
    ),
    jsonb_build_object(
      'url', 'https://www.blueearthcountymn.gov/866/Marriage-Licenses-Records',
      'source_type', 'county_clerk_site',
      'title', 'Blue Earth County Marriage Licenses & Records',
      'retrieved_at', '2026-06-11T00:00:00Z',
      'excerpt', 'As of August 1, 2016, there is no longer a 5-day waiting period for most marriage applications.',
      'fields_supported', ARRAY['standard_waiting_period_hours', 'waiting_period_waived']
    )
  ),
  last_verified_at = now(),
  verification_status = 'verified',
  change_log = change_log || jsonb_build_array(jsonb_build_object(
    'changed_at', now(),
    'changed_by', 'migration:correct_license_discount_cluster',
    'note', 'Updated Minnesota fee and waiting-period data for current state-page content.'
  ))
WHERE jurisdiction_id = 'minnesota';

INSERT INTO public.jurisdiction_benefits (
  jurisdiction_id,
  jurisdiction_type,
  jurisdiction_name,
  state_abbr,
  benefit_types,
  license_fee_cents,
  discounted_fee_cents,
  waiting_period_waived,
  standard_waiting_period_hours,
  premarital_program_required,
  hours_required,
  accepted_formats,
  accepted_formats_notes,
  approved_provider_rules,
  certificate_fields,
  submission_process,
  official_sources,
  statute_citation,
  last_verified_at,
  verification_status,
  summary_text,
  fast_path_text,
  faqs
) VALUES
(
  'utah',
  'state',
  'Utah',
  'UT',
  ARRAY['discount'],
  NULL,
  NULL,
  false,
  NULL,
  true,
  6,
  ARRAY['online', 'in_person'],
  'Utah MED allows 6 hours of marriage education or 3 hours of premarital counseling with an approved provider.',
  jsonb_build_object(
    'accepted_types', ARRAY['approved_program', 'certified_educator', 'lmft', 'lpc', 'lcsw', 'psychologist', 'clergy'],
    'approved_list_only', true,
    'approved_list_url', 'https://extension.usu.edu/strongermarriage/utah-med/',
    'state_registration_required', true,
    'notes', 'Provider must be approved for the Utah Marriage Education Discount program.'
  ),
  jsonb_build_object(
    'required_fields', ARRAY['couple_names', 'completion_date', 'provider_name', 'provider_credentials'],
    'provider_signature_required', false,
    'notarization_required', false,
    'state_issued_form', false,
    'official_form_url', 'https://extension.usu.edu/strongermarriage/utah-med/',
    'validity_days', 365
  ),
  jsonb_build_object(
    'where', 'County clerk marriage license application',
    'how', 'Use the MED completion code or approved discount process when applying.',
    'deadline_window', 'Complete the approved education or counseling before applying for the license.',
    'online_submission_allowed', true
  ),
  jsonb_build_array(jsonb_build_object(
    'url', 'https://www.utahcounty.gov/Dept/Clerk/marriage/marriagelicense.html',
    'source_type', 'county_clerk_site',
    'title', 'Utah County Online Marriage Application',
    'retrieved_at', '2026-06-11T00:00:00Z',
    'excerpt', 'Improve your relationship and save $20 with the Marriage Education Discount!',
    'fields_supported', ARRAY['benefit_types', 'discounted_fee_cents']
  )),
  'Utah Code § 30-1-30',
  now(),
  'verified',
  'Utah couples can save $20 on a marriage license through the Marriage Education Discount after completing approved premarital education or counseling.',
  'Fastest route: use a Utah MED-approved provider, get the completion code, then apply through the county clerk.',
  jsonb_build_array(
    jsonb_build_object('question', 'How much is the Utah Marriage Education Discount?', 'answer', 'The Utah MED incentive is a $20 marriage license discount.', 'jtbd', 'savings'),
    jsonb_build_object('question', 'How many hours are required in Utah?', 'answer', 'Utah accepts either 6 hours of approved marriage education or 3 hours of premarital counseling with an approved provider.', 'jtbd', 'qualify')
  )
),
(
  'west-virginia',
  'state',
  'West Virginia',
  'WV',
  ARRAY['discount'],
  5700,
  3700,
  false,
  NULL,
  true,
  4,
  ARRAY['online', 'in_person'],
  'Certificate must be dated within 12 months before applying for the license.',
  jsonb_build_object(
    'accepted_types', ARRAY['approved_program', 'certified_educator', 'lmft', 'lpc', 'lcsw', 'psychologist', 'clergy'],
    'approved_list_only', false,
    'state_registration_required', false,
    'notes', 'Course must meet West Virginia Code § 48-2-701 requirements.'
  ),
  jsonb_build_object(
    'required_fields', ARRAY['couple_names', 'completion_date', 'provider_name', 'provider_credentials', 'hours_completed'],
    'provider_signature_required', true,
    'notarization_required', false,
    'state_issued_form', false,
    'official_form_url', NULL,
    'validity_days', 365
  ),
  jsonb_build_object(
    'where', 'County clerk office',
    'how', 'Present the completion certificate when applying for the marriage license.',
    'deadline_window', 'Certificate must be completed before applying; no refunds after application.',
    'online_submission_allowed', false
  ),
  jsonb_build_array(
    jsonb_build_object(
      'url', 'https://code.wvlegislature.gov/48-2-701/',
      'source_type', 'state_statute',
      'title', 'West Virginia Code §48-2-701',
      'retrieved_at', '2026-06-11T00:00:00Z',
      'excerpt', 'Persons applying for a marriage license may attend a premarital education course of at least four hours during the twelve months immediately preceding the date of the application.',
      'fields_supported', ARRAY['hours_required', 'certificate_fields']
    ),
    jsonb_build_object(
      'url', 'https://www.monroecountywv.gov/clerk/marriage-license/67',
      'source_type', 'county_clerk_site',
      'title', 'Monroe County WV Marriage License',
      'retrieved_at', '2026-06-11T00:00:00Z',
      'excerpt', 'The fee is reduced by $20 (e.g., $37) if the couple completes a premarital education course of at least four hours within 12 months prior to applying.',
      'fields_supported', ARRAY['license_fee_cents', 'discounted_fee_cents']
    )
  ),
  'W. Va. Code § 48-2-701',
  now(),
  'verified',
  'West Virginia couples can reduce a typical $57 marriage license fee to $37 after completing at least 4 hours of premarital education within 12 months before applying.',
  'Fastest route: complete a 4-hour qualifying course, bring the certificate to the county clerk, and apply before the certificate is older than 12 months.',
  jsonb_build_array(
    jsonb_build_object('question', 'How much can West Virginia couples save?', 'answer', 'Most county clerks list a $20 reduction, commonly from $57 to $37.', 'jtbd', 'savings'),
    jsonb_build_object('question', 'How long is the West Virginia certificate valid?', 'answer', 'The course must be completed during the 12 months before the marriage license application.', 'jtbd', 'submission')
  )
)
ON CONFLICT (jurisdiction_id) DO UPDATE SET
  benefit_types = EXCLUDED.benefit_types,
  license_fee_cents = EXCLUDED.license_fee_cents,
  discounted_fee_cents = EXCLUDED.discounted_fee_cents,
  waiting_period_waived = EXCLUDED.waiting_period_waived,
  standard_waiting_period_hours = EXCLUDED.standard_waiting_period_hours,
  premarital_program_required = EXCLUDED.premarital_program_required,
  hours_required = EXCLUDED.hours_required,
  accepted_formats = EXCLUDED.accepted_formats,
  accepted_formats_notes = EXCLUDED.accepted_formats_notes,
  approved_provider_rules = EXCLUDED.approved_provider_rules,
  certificate_fields = EXCLUDED.certificate_fields,
  submission_process = EXCLUDED.submission_process,
  official_sources = EXCLUDED.official_sources,
  statute_citation = EXCLUDED.statute_citation,
  last_verified_at = EXCLUDED.last_verified_at,
  verification_status = EXCLUDED.verification_status,
  summary_text = EXCLUDED.summary_text,
  fast_path_text = EXCLUDED.fast_path_text,
  faqs = EXCLUDED.faqs;

UPDATE posts
SET
  status = 'draft',
  updated_at = now()
WHERE slug = 'indiana-marriage-license-discount';

UPDATE posts
SET
  content = replace(content, 'Tennessee and Indiana: 4 hours minimum', 'Tennessee and West Virginia: 4 hours minimum'),
  updated_at = now()
WHERE content LIKE '%Tennessee and Indiana: 4 hours minimum%';

UPDATE posts
SET
  content = replace(content, 'Florida, Texas, Minnesota, Indiana, Tennessee, Georgia, and Oklahoma', 'Florida, Texas, Minnesota, Tennessee, Georgia, Oklahoma, Utah, and West Virginia'),
  updated_at = now()
WHERE content LIKE '%Florida, Texas, Minnesota, Indiana, Tennessee, Georgia, and Oklahoma%';

UPDATE posts
SET
  content = replace(content, 'Texas, Florida, Oklahoma, Minnesota, Indiana, and Tennessee', 'Texas, Florida, Oklahoma, Minnesota, Tennessee, Utah, and West Virginia'),
  updated_at = now()
WHERE content LIKE '%Texas, Florida, Oklahoma, Minnesota, Indiana, and Tennessee%';

UPDATE posts
SET
  content = replace(content, 'Texas, Florida, Oklahoma, Indiana, Tennessee, Minnesota, Georgia, or Maryland', 'Texas, Florida, Oklahoma, Tennessee, Minnesota, Georgia, Maryland, Utah, or West Virginia'),
  updated_at = now()
WHERE content LIKE '%Texas, Florida, Oklahoma, Indiana, Tennessee, Minnesota, Georgia, or Maryland%';

UPDATE posts
SET
  content = replace(content, 'Texas, Florida, Oklahoma, Indiana, Tennessee, Minnesota, Georgia, and Maryland', 'Texas, Florida, Oklahoma, Tennessee, Minnesota, Georgia, Maryland, Utah, and West Virginia'),
  updated_at = now()
WHERE content LIKE '%Texas, Florida, Oklahoma, Indiana, Tennessee, Minnesota, Georgia, and Maryland%';

UPDATE posts
SET
  content = replace(content, 'Georgia, Maryland, Oklahoma, Indiana', 'Georgia, Maryland, Oklahoma, Utah, West Virginia'),
  updated_at = now()
WHERE content LIKE '%Georgia, Maryland, Oklahoma, Indiana%';

UPDATE posts
SET
  content = replace(content, 'Georgia, Tennessee, Oklahoma, Indiana', 'Georgia, Tennessee, Oklahoma, Utah, West Virginia'),
  updated_at = now()
WHERE content LIKE '%Georgia, Tennessee, Oklahoma, Indiana%';

UPDATE posts
SET
  content = replace(content, '- [Indiana — save up to $60 →](/blog/indiana-marriage-license-discount)', '- [West Virginia — save $20 →](/premarital-counseling/marriage-license-discount/west-virginia)'),
  updated_at = now()
WHERE content LIKE '%[Indiana — save up to $60 →](/blog/indiana-marriage-license-discount)%';
