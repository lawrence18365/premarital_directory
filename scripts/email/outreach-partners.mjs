/**
 * scripts/email/outreach-partners.mjs
 *
 * Category-C 1:1 outreach to state-approved online premarital course providers
 * (direct referral deals). Three parameterized templates: cold, follow-up,
 * and proof-led. Typed body + designed footer applied automatically.
 *
 * Dry-run by default. Examples:
 *   node scripts/email/outreach-partners.mjs --template cold \
 *     --to owner@course.com --first Jamie --state Texas \
 *     --perk "the $60 license discount and skipping the 72-hour wait"
 *
 *   ...add --send to deliver. Add --readers 240 for follow-up, \
 *      --others "Florida and Minnesota" for proof.
 */

import 'dotenv/config'
import { verify, sendMail } from './mailer.mjs'
import { buildEmail, BRAND } from './signature.mjs'

const arg = (name, fallback = undefined) => {
  const i = process.argv.indexOf(`--${name}`)
  if (i === -1) return fallback
  const next = process.argv[i + 1]
  return next && !next.startsWith('--') ? next : true
}

// ── Templates: return { subject, paragraphs } ───────────────────────────────
const templates = {
  cold: ({ first, state, perk }) => ({
    subject: `Sending you ${state} couples who need the license discount`,
    paragraphs: [
      `Hi ${first},`,
      `I run WeddingCounselors.com — a directory couples use to find premarital counseling and the approved courses that go with it.`,
      `Our guide to the ${state} marriage-license discount sits on the first page of Google, so it gets a steady stream of couples who need to finish an approved course to claim it — in ${state}, that's ${perk}. Right now we hand them general information and send them on their way.`,
      `I'd rather point them to one course we actually trust, and yours keeps coming up as one of the good ones. If you're open to it: you give me a tracked link, I feature your course on the ${state} page, and you pay only when a couple completes through us — nothing if it doesn't work.`,
      `We're featuring one provider per state, and I wanted to come to you first in ${state}. If that's interesting, just reply and I'll send the details — happy to keep it simple.`,
    ],
  }),

  followup: ({ first, state, readers }) => ({
    subject: `Re: Sending you ${state} couples who need the license discount`,
    paragraphs: [
      `Hi ${first},`,
      `Quick follow-up on this. Last month the ${state} page was read by ${readers ? `about ${readers} ` : ''}couples who need an approved course before they can get their license — that's the audience I'd be sending your way.`,
      `I'm finalizing the provider for that page this week. If referral fees aren't your thing, a flat monthly placement works too — whatever's simplest on your end.`,
      `A one-line yes or no is all I need and I'll take it from there.`,
    ],
  }),

  proof: ({ first, state, others }) => ({
    subject: `One provider slot open — ${state} couples need an approved course`,
    paragraphs: [
      `Hi ${first},`,
      `We already route couples to approved courses in ${others || 'a few other states'}, and the providers there are getting a steady trickle of pre-qualified signups straight from our state license pages.`,
      `${state} is the open slot. Same arrangement: a tracked link, featured on the ${state} license page, and you pay only on couples who complete through us.`,
      `If you'd like the slot, just reply and I'll send the details.`,
    ],
  }),
}

async function main() {
  const name = arg('template', 'cold')
  const make = templates[name]
  if (!make) {
    console.error(`Unknown template "${name}". Options: ${Object.keys(templates).join(', ')}`)
    process.exit(1)
  }

  const params = {
    first: arg('first', 'there'),
    state: arg('state', 'your state'),
    perk: arg('perk', 'the license discount'),
    readers: arg('readers'),
    others: arg('others'),
  }

  const { subject, paragraphs } = make(params)
  const { text, html, attachments } = buildEmail(paragraphs)
  const to = arg('to')
  const message = { from: `"${BRAND.name}" <${BRAND.email}>`, to, subject, text, html, attachments }

  process.stdout.write(`Verifying SMTP login as ${BRAND.email}... `)
  await verify()
  console.log('OK ✅')

  if (!to) {
    console.log('\nNo --to given. Showing assembled email (dry run):')
  }

  if (!arg('send') || !to) {
    console.log('\n── DRY RUN ───────────────────────────────────────────')
    console.log('Template:', name)
    console.log('To:      ', to || '(none)')
    console.log('Subject: ', subject)
    console.log('\n--- text part ---\n' + text)
    console.log('──────────────────────────────────────────────────────')
    console.log('Add --to <addr> and --send to deliver.')
    return
  }

  const info = await sendMail(message)
  console.log('\nSent ✅  messageId:', info.messageId)
  console.log('Accepted:', info.accepted, '| Rejected:', info.rejected)
}

main().catch((err) => {
  console.error('\nFAILED:', err.message)
  process.exit(1)
})
