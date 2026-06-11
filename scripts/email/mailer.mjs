/**
 * scripts/email/mailer.mjs
 *
 * Shared mailer: sends via Spacemail SMTP AND appends the same raw message to
 * the IMAP "Sent" folder, so messages sent by scripts actually appear in
 * webmail's Sent view (and thread properly with replies).
 *
 * The Sent-folder append is best-effort: if it fails, the send still succeeds
 * and a warning is logged.
 *
 * Exports sendMail({ from, to, subject, text, html, attachments }).
 */

import 'dotenv/config'
import nodemailer from 'nodemailer'
import { ImapFlow } from 'imapflow'

const {
  SPACEMAIL_USER,
  SPACEMAIL_PASS,
  SPACEMAIL_SMTP_HOST = 'mail.spacemail.com',
  SPACEMAIL_SMTP_PORT = '465',
  SPACEMAIL_IMAP_HOST = 'mail.spacemail.com',
  SPACEMAIL_IMAP_PORT = '993',
} = process.env

if (!SPACEMAIL_USER || !SPACEMAIL_PASS) {
  throw new Error('SPACEMAIL_USER / SPACEMAIL_PASS missing from .env')
}

const smtpPort = parseInt(SPACEMAIL_SMTP_PORT, 10)

const transporter = nodemailer.createTransport({
  host: SPACEMAIL_SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: { user: SPACEMAIL_USER, pass: SPACEMAIL_PASS },
})

export async function verify() {
  return transporter.verify()
}

async function appendToSent(raw) {
  const client = new ImapFlow({
    host: SPACEMAIL_IMAP_HOST,
    port: parseInt(SPACEMAIL_IMAP_PORT, 10),
    secure: true,
    auth: { user: SPACEMAIL_USER, pass: SPACEMAIL_PASS },
    logger: false,
  })
  // Swallow late connection errors so they never crash the process post-send.
  client.on('error', () => {})
  try {
    await client.connect()
    // Find the Sent mailbox via SPECIAL-USE \Sent, else try common names.
    let sentBox = null
    const boxes = await client.list()
    for (const box of boxes) {
      if (box.specialUse === '\\Sent') { sentBox = box.path; break }
    }
    if (!sentBox) {
      const byName = boxes.find((b) => /^(\[?Gmail\]?[./])?sent( ?(items|messages))?$/i.test(b.path) || /(^|[./])sent$/i.test(b.path))
      sentBox = byName ? byName.path : null
    }
    if (!sentBox) {
      const candidates = ['Sent', 'INBOX.Sent', 'Sent Items', 'Sent Messages']
      for (const name of candidates) {
        try { await client.status(name, { messages: true }); sentBox = name; break } catch {}
      }
    }
    if (!sentBox) throw new Error('no Sent mailbox found')
    await client.append(sentBox, raw, ['\\Seen'])
    return sentBox
  } finally {
    try { await client.logout() } catch {}
    try { client.close() } catch {}
  }
}

export async function sendMail({ from, to, subject, text, html, attachments }) {
  const message = { from, to, subject, text, html, attachments }
  // Build the raw RFC822 once so SMTP and the Sent append are byte-identical.
  const raw = await new Promise((resolve, reject) => {
    const mail = transporter._createMailComposer
      ? transporter._createMailComposer(message)
      : null
    // nodemailer doesn't expose a public composer; build via a no-send transport.
    nodemailer
      .createTransport({ streamTransport: true, buffer: true, newline: 'crlf' })
      .sendMail(message, (err, info) => {
        if (err) return reject(err)
        resolve(info.message)
      })
  })

  const info = await transporter.sendMail(message)

  try {
    const box = await appendToSent(raw)
    console.log(`[mailer] copied to Sent folder: ${box}`)
  } catch (e) {
    console.warn('[mailer] Sent-folder append failed (message still sent):', e.message)
  }

  return info
}
