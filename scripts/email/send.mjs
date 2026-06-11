/**
 * scripts/email/send.mjs
 *
 * Send a 1:1 (Category C) email from hello@weddingcounselors.com — multipart
 * (typed body + designed footer), via the shared mailer (SMTP + IMAP Sent
 * append). Safe by default: verifies login and DRY-RUNS unless you pass --send.
 *
 * Usage:
 *   node scripts/email/send.mjs --verify
 *       Test SMTP login only. Sends nothing.
 *
 *   node scripts/email/send.mjs --to x@y.com --subject "Hi" --body-file draft.txt
 *       Dry run — prints the assembled text part.
 *
 *   node scripts/email/send.mjs --to x@y.com --subject "Hi" --body-file draft.txt --send
 *       Actually sends (multipart, designed footer, appended to Sent).
 *
 * Body source: paragraphs separated by blank lines. Each becomes one typed
 * paragraph; the footer/sign-off/CAN-SPAM are added automatically.
 */

import 'dotenv/config'
import fs from 'fs'
import { verify, sendMail } from './mailer.mjs'
import { buildEmail, BRAND } from './signature.mjs'

const arg = (name, fallback = undefined) => {
  const i = process.argv.indexOf(`--${name}`)
  if (i === -1) return fallback
  const next = process.argv[i + 1]
  return next && !next.startsWith('--') ? next : true
}

async function main() {
  process.stdout.write(`Verifying SMTP login as ${BRAND.email}... `)
  await verify()
  console.log('OK ✅')

  if (arg('verify')) {
    console.log('Verify-only mode. Nothing sent.')
    return
  }

  const to = arg('to')
  const subject = arg('subject')
  const bodyFile = arg('body-file')
  const rawBody = bodyFile ? fs.readFileSync(bodyFile, 'utf8') : arg('body')

  if (!to || !subject || !rawBody) {
    console.log('\nNothing to send. Provide --to, --subject, and --body (or --body-file), or use --verify.')
    return
  }

  // Split into paragraphs on blank lines; collapse soft wraps inside a paragraph.
  const paragraphs = rawBody
    .trim()
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)

  const { text, html, attachments } = buildEmail(paragraphs)
  const message = { from: `"${BRAND.name}" <${BRAND.email}>`, to, subject, text, html, attachments }

  if (!arg('send')) {
    console.log('\n── DRY RUN (no --send) ───────────────────────────────')
    console.log('From:   ', message.from)
    console.log('To:     ', message.to)
    console.log('Subject:', message.subject)
    console.log('Parts:   multipart text/html · wordmark attached (cid)')
    console.log('\n--- assembled text part ---\n' + text)
    console.log('──────────────────────────────────────────────────────')
    console.log('Add --send to deliver.')
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
