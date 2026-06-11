/**
 * scripts/email/outreach-counselors.mjs
 *
 * Category-C 1:1 outreach to claimed / warm counselor accounts.
 * Dry-run by default; add --send to deliver.
 *
 * Examples:
 *   node scripts/email/outreach-counselors.mjs --template founding-warm \
 *     --to counselor@example.com --first Jamie --city Austin
 *
 *   ...add --send to deliver. FOUNDING_LINK_LISTING must be set for real sends.
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

const foundingLink =
  process.env.FOUNDING_LINK_LISTING ||
  process.env.REACT_APP_FOUNDING_LINK_LISTING ||
  ''

const templates = {
  'founding-warm': ({ first, city, link }) => ({
    subject: `Founding provider spot in ${city}`,
    paragraphs: [
      `Hi ${first},`,
      `I run WeddingCounselors.com. While the directory is still young I'm setting up a small group of founding providers in ${city} - a founding badge, a cleaned-up and rewritten profile, and featured placement in your city.`,
      `It's $79 one-time to lock it in. I can't promise a specific number of leads while we're this early, but I would love to include you as one of the founding providers.`,
      `If you're interested, here's the link: ${link}`,
      `Either way, glad to have you on the directory.`,
    ],
  }),
}

async function main() {
  const name = arg('template', 'founding-warm')
  const make = templates[name]
  if (!make) {
    console.error(`Unknown template "${name}". Options: ${Object.keys(templates).join(', ')}`)
    process.exit(1)
  }

  const send = Boolean(arg('send'))
  const to = arg('to')
  const params = {
    first: arg('first', 'there'),
    city: arg('city', 'your city'),
    link: foundingLink || '[FOUNDING_LINK_LISTING missing]',
  }

  if (send && !foundingLink) {
    console.error('FOUNDING_LINK_LISTING is required before sending the founding-warm pitch.')
    process.exit(1)
  }

  const { subject, paragraphs } = make(params)
  const { text, html, attachments } = buildEmail(paragraphs)
  const message = { from: `"${BRAND.name}" <${BRAND.email}>`, to, subject, text, html, attachments }

  process.stdout.write(`Verifying SMTP login as ${BRAND.email}... `)
  await verify()
  console.log('OK')

  if (!to) {
    console.log('\nNo --to given. Showing assembled email (dry run):')
  }

  if (!send || !to) {
    console.log('\n-- DRY RUN -------------------------------------------')
    console.log('Template:', name)
    console.log('To:      ', to || '(none)')
    console.log('Subject: ', subject)
    console.log('\n--- text part ---\n' + text)
    console.log('------------------------------------------------------')
    console.log('Add --to <addr> and --send to deliver.')
    return
  }

  const info = await sendMail(message)
  console.log('\nSent. messageId:', info.messageId)
  console.log('Accepted:', info.accepted, '| Rejected:', info.rejected)
}

main().catch((err) => {
  console.error('\nFAILED:', err.message)
  process.exit(1)
})
