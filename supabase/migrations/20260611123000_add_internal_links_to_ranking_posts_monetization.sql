-- Add monetized-surface links to the two existing ranking posts without
-- linking to draft content. Idempotent by checking for the section heading.

UPDATE posts
SET
  content = content || $$

## Related next steps

If you are comparing premarital methods because you need a counselor, browse [Gottman premarital counselors](/premarital-counseling/gottman), [PREPARE/ENRICH facilitators](/premarital-counseling/prepare-enrich), or [online premarital counseling](/premarital-counseling/online).

If your state offers a marriage license incentive, check the [state marriage license discount guide](/premarital-counseling/marriage-license-discount) before booking so your sessions match the required hours, provider rules, and certificate timing.

Providers who offer a structured premarital method can [claim their profile](/claim-profile) and add assessment training, certificate eligibility, and session format details.$$,
  updated_at = now()
WHERE slug = 'prepare-enrich-vs-gottman-vs-symbis'
  AND content NOT LIKE '%## Related next steps%';

UPDATE posts
SET
  content = content || $$

## Related next steps

Books are useful preparation, but they do not replace a live counselor when a couple needs help applying the material. Compare [online premarital counseling](/premarital-counseling/online), [affordable premarital counseling](/premarital-counseling/affordable), or the [state marriage license discount guide](/premarital-counseling/marriage-license-discount) if you need a course certificate.

Counselors who recommend books, assessments, or state-approved course paths can [claim their profile](/claim-profile) and add those details for couples comparing options.$$,
  updated_at = now()
WHERE slug = 'best-premarital-counseling-books'
  AND content NOT LIKE '%Books are useful preparation, but they do not replace a live counselor%';
