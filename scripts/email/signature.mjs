/**
 * scripts/email/signature.mjs
 *
 * Builds Category-C (1:1 outbound) emails per the typed-body + designed-footer
 * architecture:
 *   - BODY: bare <div>s, ZERO styling → the reader's client renders it with its
 *     own native compose styles, so it reads as if a person typed it.
 *   - FOOTER: the ONLY designed surface — a branded <table> with the real
 *     Cormorant Garamond wordmark (inline CID PNG), contact rows, slogan,
 *     and CAN-SPAM line.
 *
 * Exports buildEmail({ paragraphs }) → { text, html, attachments }.
 */

import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Brand / sender identity (edit here only) ────────────────────────────────
export const BRAND = {
  name: 'Wedding Counselors',
  domain: 'weddingcounselors.com',
  email: 'hello@weddingcounselors.com',
  slogan: 'Helping couples find the right premarital counselor.',
  dark: '#0e5e5e',
  founderFirst: 'Lawrence',
  founderLast: 'Brennan',
  role: 'Founder',
  location: 'Toronto, Canada', // CAN-SPAM physical address (city + country).
}

export const WORDMARK_PATH = path.join(__dirname, '..', '..', 'client', 'public', 'weddingcounselors-wordmark.png')
export const WORDMARK_CID = 'wc-wordmark'

// ── Plain-text part ─────────────────────────────────────────────────────────
// Each paragraph is ONE long line (no hard wraps). RFC 3676 sig delimiter "-- ".
export function buildText(paragraphs) {
  const body = paragraphs.join('\n\n')
  return `${body}

https://${BRAND.domain}

Cheers,
${BRAND.founderFirst}

--
${BRAND.founderFirst} ${BRAND.founderLast}
${BRAND.role}, ${BRAND.name} — ${BRAND.slogan}

Email:     ${BRAND.email}
Web:       https://${BRAND.domain}
Based:     ${BRAND.location}

You're receiving this email because I think ${BRAND.name} may be useful to your business. Reply "unsubscribe" and I'll remove you immediately.
`
}

// ── HTML part ───────────────────────────────────────────────────────────────
// Body = bare divs, NO styles. Footer = designed table.
export function buildHtml(paragraphs) {
  const D = BRAND.dark
  const bodyDivs = paragraphs
    .map((p) => `<div>${p}</div>`)
    .join('<div><br></div>')

  const labelStyle =
    'padding-right:20px; color:#9CA3AF; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; font-size:10px; vertical-align:middle;'

  const footer = `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%; max-width:520px; font-family:Arial, Helvetica, sans-serif;">` +
    `<tr><td style="border-top:2px solid ${D}; height:2px; line-height:0; font-size:0;">&nbsp;</td></tr>` +
    `<tr><td style="padding-top:18px; padding-bottom:14px;"><img src="cid:${WORDMARK_CID}" alt="${BRAND.name}" height="30" style="display:block; height:30px; width:auto; border:0; outline:none;" /></td></tr>` +
    `<tr><td style="padding-bottom:18px;"><div style="font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#4B5563; line-height:1.55;"><span style="color:${D}; font-weight:700;">${BRAND.founderFirst} ${BRAND.founderLast}</span><span style="color:#9CA3AF;"> &nbsp;·&nbsp; </span><span style="color:#4B5563;">${BRAND.role}</span><br/><span style="color:#6B7280; font-style:italic;">${BRAND.slogan}</span></div></td></tr>` +
    `<tr><td style="padding-bottom:18px;"><table cellpadding="0" cellspacing="0" border="0" role="presentation" style="font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.9;">` +
      `<tr><td style="${labelStyle}">Web</td><td style="vertical-align:middle;"><a href="https://${BRAND.domain}" style="color:${D}; text-decoration:none;">${BRAND.domain}</a></td></tr>` +
      `<tr><td style="${labelStyle}">Email</td><td style="vertical-align:middle;"><a href="mailto:${BRAND.email}" style="color:${D}; text-decoration:none;">${BRAND.email}</a></td></tr>` +
      `<tr><td style="${labelStyle}">Based</td><td style="vertical-align:middle; color:#4B5563;">${BRAND.location}</td></tr>` +
    `</table></td></tr>` +
    `<tr><td style="padding-top:14px; border-top:1px solid #F3F4F6;"><div style="font-family:Arial, Helvetica, sans-serif; font-size:11px; color:#9CA3AF; line-height:1.6;">You're receiving this because I think ${BRAND.name} may be useful to your business. Reply "unsubscribe" and I'll remove you immediately.</div></td></tr>` +
    `</table>`

  return `<div dir="ltr">${bodyDivs}<div><br></div><div><a href="https://${BRAND.domain}">https://${BRAND.domain}</a></div><div><br></div><div>Cheers,</div><div>${BRAND.founderFirst}</div><div><br></div><div><br></div>${footer}</div>`
}

// ── Convenience: full email parts from paragraph array ──────────────────────
export function buildEmail(paragraphs) {
  return {
    text: buildText(paragraphs),
    html: buildHtml(paragraphs),
    attachments: [
      {
        filename: 'weddingcounselors-wordmark.png',
        path: WORDMARK_PATH,
        cid: WORDMARK_CID,
      },
    ],
  }
}
