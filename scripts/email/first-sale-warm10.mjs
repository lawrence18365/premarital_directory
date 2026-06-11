/**
 * First-sale warm10 motion for claimed WeddingCounselors.com profiles.
 *
 * Local PII artifacts are written to scripts/email/_warm10*.json and ignored.
 * Real sends require --send. Default delay is 3 minutes between counselor sends.
 */

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import { ImapFlow } from 'imapflow'
import { verify, sendMail } from './mailer.mjs'
import { buildEmail, BRAND } from './signature.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..')
const WARM10_PATH = path.join(__dirname, '_warm10.json')
const BACKUP_PATH = path.join(__dirname, '_warm10_backup.json')
const DRAFTS_PATH = path.join(__dirname, '_warm10_drafts.json')
const SENT_PATH = path.join(__dirname, '_warm10_sent.json')
const REPLIES_PATH = path.join(__dirname, '_warm10_replies.json')

const OWNER_INBOX = 'lbarwe1@gmail.com'
const ONE_DAY_MS = 24 * 60 * 60 * 1000
const FEATURE_UNTIL = new Date(Date.now() + 14 * ONE_DAY_MS).toISOString()

const arg = (name, fallback = undefined) => {
  const i = process.argv.indexOf(`--${name}`)
  if (i === -1) return fallback
  const next = process.argv[i + 1]
  return next && !next.startsWith('--') ? next : true
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const asArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : [])
const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim()
const unique = (items) => [...new Set(items.map(clean).filter(Boolean))]
const nowIso = () => new Date().toISOString()

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function appendJson(file, entries) {
  const existing = readJson(file, [])
  writeJson(file, [...existing, ...entries])
}

function citySlug(city) {
  return clean(city)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function profileUrl(profile) {
  return `https://www.weddingcounselors.com/premarital-counseling/${clean(profile.state_province).toLowerCase()}/${citySlug(profile.city)}/${profile.slug}`
}

function validEmail(email) {
  const value = clean(email).toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !/no-?reply|example|test/.test(value)
}

function marketingAllowed(profile) {
  return profile?.marketing_opt_in === true || profile?.email_preferences?.marketing === true
}

function daysAgo(value) {
  if (!value) return 9999
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? (Date.now() - parsed) / ONE_DAY_MS : 9999
}

function selectionScore(profile) {
  let score = 0
  score += Math.max(0, 90 - Math.min(daysAgo(profile.claimed_at), 90))
  score += Math.min(clean(profile.bio).length / 40, 35)
  score += Math.min(asArray(profile.specialties).length * 2, 28)
  score += Math.min(asArray(profile.treatment_approaches).length * 3, 21)
  score += Math.min(Number(profile.profile_completeness_score) || 0, 100) / 2
  if (profile.website) score += 5
  if (profile.is_sponsored) score -= 30
  return Math.round(score * 10) / 10
}

const FIRST_NAMES = {
  'prophetess-rev-dr-anastasia-alysse-barthelemy-brown-prophetic-minister': 'Anastasia',
  'deborah-russo': 'Dr. Russo',
  'sarah-kenville-lmft': 'Sarah',
}

const PROFILE_UPDATES = {
  'prophetess-rev-dr-anastasia-alysse-barthelemy-brown-prophetic-minister': {
    specialtyFocus: 'faith-based premarital counseling',
    bio: 'Prophetess, Rev. Dr. Anastasia Alysse Barthelemy Brown offers faith-centered premarital and spiritual counseling for couples in Harvey, Louisiana, with hybrid session options. Her work emphasizes sacred preparation for marriage, communication, conflict resolution, family-of-origin conversations, interfaith and intercultural dynamics, and a spiritually grounded understanding of covenant. Couples who want premarital support in a prayerful, values-led setting can use this profile to understand her focus on emotional safety, practical conversations, and preparation for a committed union.',
    specialties: ['Faith-Based Counseling', 'Communication Skills', 'Conflict Resolution', 'Interfaith Couples', 'Intercultural Couples', 'Blended Families', 'Second Marriages', 'Family Planning', 'In-Law Relationships', 'Anxiety About Marriage'],
    treatment_approaches: ['Faith-Based Counseling', 'PREPARE/ENRICH', 'Attachment-Based', 'Emotionally Focused (EFT)', 'Solution-Focused', 'Catholic Pre-Cana'],
    certifications: ['Marriage License Discount Provider'],
    client_focus: ['Engaged Couples', 'Newly Engaged', 'Interfaith Couples', 'Intercultural Couples', 'Second Marriages', 'Blended Families', 'Planning Wedding Soon'],
    bio_approach: 'Faith-centered premarital support focused on covenant, communication, conflict resolution, and emotionally safe conversations before marriage.',
    bio_ideal_client: 'Best fit for engaged couples who want spiritual premarital counseling, including interfaith, intercultural, blended-family, or second-marriage preparation.',
    bio_outcomes: 'Couples can expect a clearer shared foundation, more intentional conversations, and practical preparation for a committed spiritual union.',
  },
  'odunayo-samo': {
    specialtyFocus: 'Gottman and SYMBIS premarital preparation',
    bio: 'Odunayo Samo offers online premarital coaching for couples in Houston and across Texas who want more than a quick pre-wedding check-in. Her three-part framework helps each partner understand personal triggers, attachment needs, expectations, intimacy, communication, conflict resolution, and the marriage blueprint they want to build together. She draws on Gottman, SYMBIS, Emotionally Focused Therapy, attachment-based work, CBT, and faith-based counseling, with Twogether in Texas experience for couples who want a structured, skill-building process.',
    specialties: ['Communication Skills', 'Conflict Resolution', 'Financial Planning', 'Intimacy & Sexuality', 'Family Planning', 'Faith-Based Counseling', 'Intercultural Couples', 'Long-Distance Relationships', 'Anxiety About Marriage', 'Career/Work-Life Balance'],
    treatment_approaches: ['Gottman Method', 'SYMBIS Assessment', 'Emotionally Focused (EFT)', 'Attachment-Based', 'Solution-Focused', 'Cognitive Behavioral (CBT)', 'Faith-Based Counseling', 'Twogether in Texas'],
    certifications: ['Gottman Certified Therapist', 'SYMBIS Certified', 'Twogether in Texas Provider', 'Marriage License Discount Provider'],
    client_focus: ['Engaged Couples', 'Newly Engaged', 'Planning Wedding Soon', 'Newlyweds (First Year)', 'Intercultural Couples', 'Interfaith Couples', 'Long-Distance Couples'],
    bio_approach: 'Online premarital coaching using a three-part framework for individual awareness, couple expectations, communication, intimacy, and a shared marriage blueprint.',
    bio_ideal_client: 'Best fit for engaged Texas couples who want comprehensive preparation, faith-sensitive support, and active practice between sessions.',
    bio_outcomes: 'Couples leave with deeper self-awareness, practical communication tools, conflict-resolution skills, and a clearer plan for their future marriage.',
  },
  'alejandra-weiss': {
    specialtyFocus: 'online couples therapy and premarital communication',
    bio: 'Alejandra Weiss provides online couples and premarital therapy throughout Ohio for partners who feel stuck in conflict, emotional distance, intimacy concerns, or trust repair. Her work is collaborative and practical, helping couples understand communication patterns, strengthen emotional attunement, discuss finances and family expectations, and build clearer long-term goals before marriage. She draws from PREPARE/ENRICH, Gottman Method, Emotionally Focused Therapy, CBT, solution-focused work, and attachment-based counseling.',
    specialties: ['Communication Skills', 'Conflict Resolution', 'Intimacy & Sexuality', 'Financial Planning', 'Family Planning', 'Trust Repair', 'Blended Families', 'Interfaith Couples', 'Intercultural Couples', 'LGBTQ+ Affirming', 'Trauma-Informed'],
    treatment_approaches: ['PREPARE/ENRICH', 'Gottman Method', 'Emotionally Focused (EFT)', 'Cognitive Behavioral (CBT)', 'Solution-Focused', 'Attachment-Based'],
    certifications: ['PREPARE/ENRICH Certified', 'Gottman Certified Therapist', 'Emotionally Focused (EFT) Certified'],
    client_focus: ['Engaged Couples', 'Newly Engaged', 'Planning Wedding Soon', 'Newlyweds (First Year)', 'LGBTQ+ Couples', 'Interfaith Couples', 'Intercultural Couples', 'Long-Distance Couples'],
    bio_approach: 'Online Ohio couples therapy that blends PREPARE/ENRICH, Gottman, EFT, CBT, solution-focused, and attachment-based work.',
    bio_ideal_client: 'Best fit for engaged or committed couples who care deeply about the relationship but feel caught in repeat conflict, distance, or misunderstanding.',
    bio_outcomes: 'Couples build clearer communication, stronger boundaries, shared expectations, and practical tools for handling difficult conversations before marriage.',
  },
  'deborah-russo': {
    specialtyFocus: 'assessment-based premarital counseling',
    bio: 'Dr. Russo offers compassionate, proactive couples and premarital counseling in Sandy Springs, Georgia, with in-person and online sessions. Her work combines evidence-based inventories and relationship assessments, including PREPARE/ENRICH, SYMBIS, FOCCUS, the Gottman Relationship Checkup, and Enneagram-informed trait work. She helps dating, engaged, newly married, and couples-in-recovery clarify expectations, understand primary needs and emotions, communicate through differences, strengthen intimacy, and build a team-based approach to challenges.',
    specialties: ['Communication Skills', 'Conflict Resolution', 'Intimacy & Sexuality', 'Trust Repair', 'Blended Families', 'Interfaith Couples', 'Faith-Based Counseling', 'Catholic Marriage Prep', 'Trauma-Informed', 'In-Law Relationships'],
    treatment_approaches: ['PREPARE/ENRICH', 'SYMBIS Assessment', 'FOCCUS Inventory', 'Gottman Method', 'Emotionally Focused (EFT)', 'Attachment-Based', 'Cognitive Behavioral (CBT)', 'Faith-Based Counseling', 'Catholic Pre-Cana'],
    certifications: ['PREPARE/ENRICH Certified', 'SYMBIS Certified', 'FOCCUS Trained', 'Gottman Certified Therapist', 'Marriage License Discount Provider'],
    client_focus: ['Engaged Couples', 'Newly Engaged', 'Planning Wedding Soon', 'Newlyweds (First Year)', 'Couples in Recovery', 'Interfaith Couples', 'Blended Families', 'Second Marriages'],
    bio_approach: 'Assessment-based couples work using PREPARE/ENRICH, SYMBIS, FOCCUS, Gottman, EFT, CBT, narrative, and attachment-informed methods.',
    bio_ideal_client: 'Best fit for intentional dating, engaged, newly married, and couples-in-recovery who want structure, insight, and practical tools.',
    bio_outcomes: 'Couples can expect clearer expectations, stronger communication, deeper attunement, better conflict navigation, and rituals of connection.',
  },
  'lily-pernoud': {
    specialtyFocus: 'PREPARE/ENRICH and Gottman-informed counseling',
    bio: 'Lily Pernoud helps couples in Saint Louis build deeper connection, emotional safety, and lasting intimacy through warm, steady premarital and relationship counseling. Her work supports couples preparing for marriage as well as partners tending to a strained relationship, with attention to communication, conflict resolution, blended-family dynamics, intimacy, in-law relationships, and faith-sensitive conversations. She draws from PREPARE/ENRICH, Gottman Method, CBT, attachment-based work, and faith-based counseling.',
    specialties: ['Communication Skills', 'Conflict Resolution', 'Intimacy & Sexuality', 'Blended Families', 'Second Marriages', 'Faith-Based Counseling', 'Anxiety About Marriage', 'In-Law Relationships', 'Family Planning', 'Career/Work-Life Balance'],
    treatment_approaches: ['PREPARE/ENRICH', 'Gottman Method', 'Attachment-Based', 'Cognitive Behavioral (CBT)', 'Faith-Based Counseling'],
    certifications: ['PREPARE/ENRICH Certified'],
    client_focus: ['Engaged Couples', 'Newly Engaged', 'Planning Wedding Soon', 'Newlyweds (First Year)', 'Second Marriages', 'Blended Families', 'Long-Distance Couples'],
    bio_approach: 'Warm, insight-oriented counseling using PREPARE/ENRICH, Gottman-informed tools, CBT, attachment-based, and faith-sensitive work.',
    bio_ideal_client: 'Best fit for engaged or committed couples who want to improve communication, rebuild trust, and strengthen emotional safety.',
    bio_outcomes: 'Couples can expect greater clarity, steadier conflict conversations, and practical support for building a more connected marriage.',
  },
  'amanda-rausch': {
    specialtyFocus: 'LGBTQ+ affirming premarital and couples counseling',
    bio: 'Amanda Rausch provides premarital and couples counseling in Seattle with hybrid session options through No Stress No Stigma. Her work helps couples understand life patterns, reduce symptoms, and address the roots of conflict rather than only the surface issue. She brings a compassionate, direct, and stigma-free style to communication, conflict resolution, intimacy, financial conversations, blended-family dynamics, LGBTQ+ affirming care, military or long-distance relationships, and intercultural couples preparing for marriage.',
    specialties: ['Communication Skills', 'Conflict Resolution', 'LGBTQ+ Affirming', 'Intimacy & Sexuality', 'Financial Planning', 'Blended Families', 'Intercultural Couples', 'Military Couples', 'Long-Distance Relationships', 'Trauma-Informed'],
    treatment_approaches: ['Gottman Method', 'Emotionally Focused (EFT)', 'Cognitive Behavioral (CBT)', 'Solution-Focused', 'Attachment-Based'],
    certifications: [],
    client_focus: ['Engaged Couples', 'Newly Engaged', 'Planning Wedding Soon', 'LGBTQ+ Couples', 'Interfaith Couples', 'Intercultural Couples', 'Military/First Responders', 'Long-Distance Couples', 'Blended Families'],
    bio_approach: 'Compassionate, stigma-free couples counseling that blends Gottman, EFT, CBT, solution-focused, and attachment-based approaches.',
    bio_ideal_client: 'Best fit for Seattle couples who want practical, affirming support for communication, conflict, intimacy, and major life transitions.',
    bio_outcomes: 'Couples can expect a clearer understanding of their patterns, more honest conversations, and practical next steps for reducing conflict.',
  },
  'heidi-farrell': {
    specialtyFocus: 'blended-family and attachment-focused premarital coaching',
    bio: 'Heidi Farrell offers premarital and marriage coaching in Kearney, Nebraska, with hybrid options for couples locally and online. As a certified marriage coach trained in stepfamily therapy, she helps couples communicate needs safely, understand attachment styles, manage expectations, and work through conflict with practical tools. Her coaching is especially relevant for engaged couples, blended families, second marriages, long-distance couples, and partners balancing marriage, work, children, and faith-centered values.',
    specialties: ['Communication Skills', 'Conflict Resolution', 'Blended Families', 'Second Marriages', 'Intimacy & Sexuality', 'Long-Distance Relationships', 'Faith-Based Counseling', 'In-Law Relationships', 'Career/Work-Life Balance', 'Family Planning'],
    treatment_approaches: ['Attachment-Based', 'Cognitive Behavioral (CBT)', 'Faith-Based Counseling'],
    certifications: [],
    client_focus: ['Engaged Couples', 'Newly Engaged', 'Planning Wedding Soon', 'Newlyweds (First Year)', 'Second Marriages', 'Blended Families', 'Long-Distance Couples', 'Intercultural Couples'],
    bio_approach: 'Premarital and marriage coaching focused on safe communication, attachment styles, conflict resolution, and stepfamily dynamics.',
    bio_ideal_client: 'Best fit for engaged couples, blended families, second marriages, and partners who want practical communication tools before marriage.',
    bio_outcomes: 'Couples leave with clearer expectations, safer conflict conversations, achievable goals, and practical steps for building a united home.',
  },
  'jinal-mehta': {
    specialtyFocus: 'culturally responsive couples therapy',
    bio: 'Jinal Mehta offers online couples and premarital therapy from New York with a culturally responsive lens, including experience supporting South Asian couples and partners from diverse cultural, ethnic, and religious backgrounds. Her work helps couples identify repeat conflict cycles, improve communication, rebuild emotional connection, and explore how family, culture, acculturation, and life transitions shape the relationship. She draws from EFT, CBT, narrative therapy, solution-focused work, and Gottman-informed couples tools while keeping emotional safety central.',
    specialties: ['Communication Skills', 'Conflict Resolution', 'Intercultural Couples', 'Interfaith Couples', 'Anxiety About Marriage', 'In-Law Relationships', 'Career/Work-Life Balance', 'Trauma-Informed', 'Financial Planning', 'Blended Families'],
    treatment_approaches: ['Emotionally Focused (EFT)', 'Cognitive Behavioral (CBT)', 'Gottman Method', 'Solution-Focused', 'Narrative Therapy'],
    certifications: [],
    client_focus: ['Engaged Couples', 'Newly Engaged', 'Planning Wedding Soon', 'Newlyweds (First Year)', 'Intercultural Couples', 'Interfaith Couples', 'Second Marriages', 'Blended Families', 'Long-Distance Couples'],
    bio_approach: 'Culturally responsive online couples therapy using EFT, CBT, narrative, solution-focused, and Gottman-informed tools.',
    bio_ideal_client: 'Best fit for couples navigating communication problems, family or cultural expectations, emotional distance, or major life transitions.',
    bio_outcomes: 'Couples can expect a safer dialogue, more accountability, clearer conflict patterns, and healthier ways to respond to each other.',
  },
  'maricruz-valdez': {
    specialtyFocus: 'faith-integrated premarital counseling',
    bio: 'Maricruz Valdez offers premarital counseling in San Antonio for couples who want to build a strong foundation before marriage. Her work creates a supportive space to discuss expectations, communication styles, conflict resolution, finances, intimacy, family dynamics, shared values, and spiritual priorities. She blends evidence-based counseling tools, cognitive behavioral principles, relationship research, practical communication strategies, Twogether in Texas experience, and a biblically grounded perspective for couples who want faith-integrated preparation.',
    specialties: ['Communication Skills', 'Conflict Resolution', 'Financial Planning', 'Family Planning', 'Faith-Based Counseling', 'Anxiety About Marriage', 'Intimacy & Sexuality', 'In-Law Relationships'],
    treatment_approaches: ['Twogether in Texas', 'Cognitive Behavioral (CBT)', 'Solution-Focused', 'Attachment-Based', 'Faith-Based Counseling'],
    certifications: ['Twogether in Texas Provider', 'FOCCUS Trained'],
    client_focus: ['Engaged Couples', 'Newly Engaged', 'Planning Wedding Soon', 'Newlyweds (First Year)', 'Interfaith Couples', 'Young Adults (20s)', 'Adults (30s-40s)'],
    bio_approach: 'Faith-integrated premarital counseling that blends CBT principles, relationship research, practical communication tools, and biblical values.',
    bio_ideal_client: 'Best fit for couples who want a proactive premarital process, practical communication skills, and a faith-centered marriage foundation.',
    bio_outcomes: 'Couples leave with shared understanding, healthier communication skills, and a more intentional foundation for married life.',
  },
  'sarah-kenville-lmft': {
    specialtyFocus: 'PREPARE/ENRICH premarital counseling',
    bio: 'Sarah Kenville, LMFT offers premarital and relationship counseling in Minneapolis with hybrid session options and a strengths-based, skill-building approach. She uses the PREPARE/ENRICH assessment to help dating, engaged, newlywed, same-sex, blended-family, interfaith, intercultural, and military couples talk through communication, conflict resolution, finances, family relationships, intimacy, parenting expectations, and long-term goals. Her work gives couples a neutral, supportive space to build practical tools before marriage.',
    specialties: ['Communication Skills', 'Conflict Resolution', 'Financial Planning', 'Intimacy & Sexuality', 'Family Planning', 'Second Marriages', 'Blended Families', 'Interfaith Couples', 'Intercultural Couples', 'LGBTQ+ Affirming', 'Military Couples'],
    treatment_approaches: ['PREPARE/ENRICH'],
    certifications: ['PREPARE/ENRICH Certified', 'Marriage License Discount Provider'],
    client_focus: ['Engaged Couples', 'Newly Engaged', 'Planning Wedding Soon', 'Newlyweds (First Year)', 'LGBTQ+ Couples', 'Second Marriages', 'Blended Families', 'Military/First Responders', 'Intercultural Couples', 'Interfaith Couples'],
    bio_approach: 'Strengths-based PREPARE/ENRICH premarital counseling focused on skills, shared expectations, and structured relationship conversations.',
    bio_ideal_client: 'Best fit for Minnesota couples who want guided conversations about communication, conflict, finances, family, intimacy, and marriage expectations.',
    bio_outcomes: 'Couples gain practical tools, a clearer shared foundation, and confidence that key relationship topics have been explored before marriage.',
  },
}

function getFirstName(profile) {
  if (FIRST_NAMES[profile.slug]) return FIRST_NAMES[profile.slug]
  const name = clean(profile.full_name)
  if (!name) return 'there'
  return name.replace(/^(Dr\.|Rev\.|Pastor|Prophetess|Mr\.|Mrs\.|Ms\.)\s+/i, '').split(/\s+/)[0]
}

function primarySpecialty(profile) {
  return PROFILE_UPDATES[profile.slug]?.specialtyFocus ||
    asArray(profile.specialties).find((item) => /premarital|communication|conflict|faith|gottman|prepare|symbis/i.test(item)) ||
    asArray(profile.specialties)[0] ||
    'premarital counseling'
}

function buildSelection(profile) {
  return {
    id: profile.id,
    name: clean(profile.full_name),
    first: getFirstName(profile),
    email: clean(profile.email),
    city: clean(profile.city),
    state: clean(profile.state_province),
    specialty: primarySpecialty(profile),
    slug: profile.slug,
    profile_url: profileUrl(profile),
    selection_score: selectionScore(profile),
  }
}

function buildProfileUpdate(profile) {
  const manual = PROFILE_UPDATES[profile.slug]
  if (!manual) {
    throw new Error(`No manual update map for selected profile slug: ${profile.slug}`)
  }
  return {
    bio: manual.bio,
    bio_approach: manual.bio_approach,
    bio_ideal_client: manual.bio_ideal_client,
    bio_outcomes: manual.bio_outcomes,
    specialties: unique(manual.specialties),
    treatment_approaches: unique(manual.treatment_approaches),
    certifications: unique(manual.certifications),
    client_focus: unique(manual.client_focus),
    is_sponsored: true,
    sponsored_rank: 2,
    sponsored_until: FEATURE_UNTIL,
    tier: 'local_featured',
    featured_cities: unique([...asArray(profile.featured_cities), citySlug(profile.city)]),
    featured_until: FEATURE_UNTIL,
  }
}

function baseQuery(supabase) {
  return supabase
    .from('profiles')
    .select('*')
    .eq('is_claimed', true)
    .not('email', 'is', null)
    .eq('is_hidden', false)
    .limit(200)
}

function createSupabase() {
  const url = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || 'https://bkjwctlolhoxhnoospwp.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function fetchSelectedRows(supabase) {
  const selection = readJson(WARM10_PATH, [])
  if (selection.length !== 10) throw new Error(`${WARM10_PATH} must contain 10 selected profiles`)
  const ids = selection.map((item) => item.id)
  const { data, error } = await supabase.from('profiles').select('*').in('id', ids)
  if (error) throw error
  const byId = new Map((data || []).map((row) => [row.id, row]))
  return selection.map((item) => {
    const row = byId.get(item.id)
    if (!row) throw new Error(`Selected profile not found: ${item.id}`)
    return row
  })
}

async function selectWarm10(supabase) {
  const existing = readJson(WARM10_PATH, null)
  if (Array.isArray(existing) && existing.length === 10 && !arg('fresh')) {
    console.log(`Reusing existing ${path.relative(ROOT, WARM10_PATH)}`)
    return existing
  }

  const { data, error } = await baseQuery(supabase)
  if (error) throw error

  const eligible = (data || [])
    .filter((profile) => validEmail(profile.email))
    .filter((profile) => marketingAllowed(profile))
    .filter((profile) => profile.city && profile.state_province && profile.slug)
    .filter((profile) => clean(profile.bio).length >= 120)
    .filter((profile) => PROFILE_UPDATES[profile.slug])
    .sort((a, b) => selectionScore(b) - selectionScore(a))

  if (eligible.length < 10) {
    throw new Error(`Only ${eligible.length} eligible profiles had update maps; need 10`)
  }

  const selected = eligible.slice(0, 10).map(buildSelection)
  writeJson(WARM10_PATH, selected)
  console.log(`Saved ${selected.length} selected profiles to ${path.relative(ROOT, WARM10_PATH)}`)
  return selected
}

async function backupAndUpdateProfiles(supabase) {
  const rows = await fetchSelectedRows(supabase)
  const existingBackup = readJson(BACKUP_PATH, null)
  if (!existingBackup) {
    writeJson(BACKUP_PATH, {
      created_at: nowIso(),
      feature_until: FEATURE_UNTIL,
      profiles: rows.map((row) => ({ ...row })),
    })
    console.log(`Saved original rows to ${path.relative(ROOT, BACKUP_PATH)}`)
  } else {
    console.log(`Reusing existing backup ${path.relative(ROOT, BACKUP_PATH)}`)
  }

  const summaries = []
  for (const row of rows) {
    const update = buildProfileUpdate(row)
    const { data, error } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', row.id)
      .select('id,full_name,city,state_province,slug,bio,specialties,treatment_approaches,certifications,client_focus,is_sponsored,sponsored_rank,tier,featured_cities,featured_until,sponsored_until,profile_completeness_score')
      .single()
    if (error) throw error
    summaries.push({
      id: row.id,
      name: row.full_name,
      slug: row.slug,
      before_bio_length: clean(row.bio).length,
      after_bio_length: clean(data.bio).length,
      specialty_focus: primarySpecialty(row),
      featured: Boolean(data.is_sponsored) && Number(data.sponsored_rank) === 2,
      tier: data.tier,
      featured_cities: data.featured_cities,
      featured_until: data.featured_until,
    })
  }
  console.log(`Updated ${summaries.length} profiles with rewritten bios and featured placement`)
  return summaries
}

function buildPitch(profile) {
  const selected = buildSelection(profile)
  const link = process.env.FOUNDING_LINK_LISTING || process.env.REACT_APP_FOUNDING_LINK_LISTING || ''
  if (!/^https:\/\/buy\.stripe\.com\//.test(link)) {
    throw new Error('FOUNDING_LINK_LISTING must be a Stripe buy.stripe.com URL before sending')
  }
  const subject = `I updated your ${selected.city} profile`
  const paragraphs = [
    `Hi ${selected.first},`,
    `I run WeddingCounselors.com. You already have a profile on the directory, so I went ahead and rewrote it, tidied up your ${selected.specialty} focus, and featured you as a premarital counselor in ${selected.city}.`,
    `Here's how it looks now: ${selected.profile_url}`,
    `While we're early, I'm locking in a small group of founding providers at $79 one-time to keep the featured spot. If you want me to keep yours live, here's the link: ${link}`,
    'Either way, glad to have you on the directory.',
  ]
  return {
    ...selected,
    subject,
    paragraphs,
  }
}

function selfReviewDrafts(drafts, updatedSummaries) {
  const updatedById = new Map(updatedSummaries.map((item) => [item.id, item]))
  const failures = []
  for (const draft of drafts) {
    const text = draft.paragraphs.join('\n')
    const update = updatedById.get(draft.id)
    if (!update?.featured) failures.push(`${draft.name}: profile is not featured`)
    if (!text.includes('rewrote it')) failures.push(`${draft.name}: rewrite claim missing`)
    if (!text.includes('featured you')) failures.push(`${draft.name}: featured claim missing`)
    if (!text.includes(draft.city)) failures.push(`${draft.name}: city missing`)
    if (!text.includes(draft.profile_url)) failures.push(`${draft.name}: profile URL missing`)
    if (!/https:\/\/buy\.stripe\.com\//.test(text)) failures.push(`${draft.name}: Stripe link missing`)
    if (/guarantee|guaranteed|leads?|income|revenue/i.test(text)) failures.push(`${draft.name}: forbidden sales promise language`)
  }
  if (failures.length) {
    throw new Error(`Self-review failed:\n${failures.join('\n')}`)
  }
  console.log(`Self-review passed for ${drafts.length} drafts`)
}

async function buildAndReviewDrafts(supabase, updatedSummaries) {
  const rows = await fetchSelectedRows(supabase)
  const drafts = rows.map(buildPitch)
  selfReviewDrafts(drafts, updatedSummaries)
  writeJson(DRAFTS_PATH, {
    created_at: nowIso(),
    drafts: drafts.map((draft) => ({
      id: draft.id,
      name: draft.name,
      email: draft.email,
      city: draft.city,
      specialty: draft.specialty,
      slug: draft.slug,
      profile_url: draft.profile_url,
      subject: draft.subject,
      paragraphs: draft.paragraphs,
    })),
  })
  console.log(`Saved reviewed drafts to ${path.relative(ROOT, DRAFTS_PATH)}`)
  return drafts
}

async function sendProofRecord(drafts) {
  if (!Boolean(arg('send'))) {
    console.log('Dry run: proof record not sent without --send')
    return
  }
  const alreadySent = readJson(SENT_PATH, []).some((entry) => entry.kind === 'proof-record' && entry.status === 'sent')
  if (alreadySent && !arg('force-proof')) {
    console.log('Proof record already sent; skipping')
    return
  }

  const paragraphs = [
    'Warm10 finalized pitch record.',
    `Generated at ${nowIso()}. Each counselor profile was rewritten and marked featured before these drafts were sent.`,
    ...drafts.flatMap((draft, index) => [
      `${index + 1}. ${draft.name} <${draft.email}> - ${draft.city}, ${draft.state} - ${draft.specialty}`,
      `Subject: ${draft.subject}`,
      draft.paragraphs.join('\n'),
    ]),
  ]
  const email = buildEmail(paragraphs)
  const info = await sendMail({
    from: `"${BRAND.name}" <${BRAND.email}>`,
    to: OWNER_INBOX,
    subject: 'Warm10 finalized pitch record',
    ...email,
  })
  appendJson(SENT_PATH, [{
    kind: 'proof-record',
    to: OWNER_INBOX,
    sent_at: nowIso(),
    status: info.rejected?.length ? 'rejected' : 'sent',
    messageId: info.messageId,
    accepted: info.accepted || [],
    rejected: info.rejected || [],
  }])
  console.log(`Sent proof record to ${OWNER_INBOX}`)
}

function normalizeAddress(value) {
  return clean(value).replace(/^.*<([^>]+)>.*$/, '$1').toLowerCase()
}

function classifyReply(text) {
  const value = clean(text).toLowerCase()
  if (/paid|payment|purchased|bought|receipt|done|completed|just paid|signed up/.test(value)) return 'payment-confirmation'
  if (/interested|yes|sounds good|let.s do|send|how do|tell me more|keep/.test(value)) return 'interested'
  if (/\?|question|what|how much|details|explain/.test(value)) return 'question'
  if (/not interested|no thanks|remove|unsubscribe|stop|do not contact/.test(value)) return 'not-interested'
  if (/too expensive|cost|price|lead|traffic|why|concern|already/.test(value)) return 'objection'
  return 'question'
}

function draftHumanResponse(classification, profile) {
  const first = profile.first || 'there'
  if (classification === 'interested') {
    return `Hi ${first}, thanks for the reply. Yes, I can keep the upgraded featured listing live. The one-time founding link is in my previous note; once it is paid I will leave the featured placement in place and keep the rewritten profile live.`
  }
  if (classification === 'payment-confirmation') {
    return `Hi ${first}, thank you. I will confirm the payment on my side and keep the featured listing live.`
  }
  if (classification === 'not-interested') {
    return `Hi ${first}, no problem at all. I will remove you from outreach and can roll the listing back if you prefer.`
  }
  if (classification === 'objection') {
    return `Hi ${first}, that is fair. I am not selling guaranteed leads while the site is early; the $79 is just for the profile cleanup and featured placement. Happy to leave the basic profile in place either way.`
  }
  return `Hi ${first}, happy to clarify. The $79 is a one-time founding provider fee to keep the rewritten profile and featured placement live while WeddingCounselors.com is still early. I am not promising a specific number of leads.`
}

async function monitorReplies(since = new Date(Date.now() - ONE_DAY_MS)) {
  const selected = readJson(WARM10_PATH, [])
  const byEmail = new Map(selected.map((item) => [normalizeAddress(item.email), item]))
  if (byEmail.size === 0) return []

  const client = new ImapFlow({
    host: process.env.SPACEMAIL_IMAP_HOST || 'mail.spacemail.com',
    port: parseInt(process.env.SPACEMAIL_IMAP_PORT || '993', 10),
    secure: true,
    auth: {
      user: process.env.SPACEMAIL_USER,
      pass: process.env.SPACEMAIL_PASS,
    },
    logger: false,
  })
  client.on('error', () => {})

  const found = []
  try {
    await client.connect()
    await client.mailboxOpen('INBOX')
    const search = await client.search({ since })
    for await (const msg of client.fetch(search, { envelope: true, source: true, internalDate: true })) {
      const from = normalizeAddress(msg.envelope?.from?.[0]?.address || '')
      const profile = byEmail.get(from)
      if (!profile) continue
      const source = msg.source ? msg.source.toString('utf8') : ''
      const classification = classifyReply(source)
      found.push({
        profile_id: profile.id,
        name: profile.name,
        email: profile.email,
        from,
        subject: msg.envelope?.subject || '',
        date: msg.internalDate ? new Date(msg.internalDate).toISOString() : nowIso(),
        classification,
        suggested_response: draftHumanResponse(classification, profile),
      })
    }
  } finally {
    try { await client.logout() } catch {}
    try { client.close() } catch {}
  }

  const deduped = []
  const existing = readJson(REPLIES_PATH, [])
  const seen = new Set(existing.map((item) => `${item.email}|${item.subject}|${item.date}`))
  for (const reply of found) {
    const key = `${reply.email}|${reply.subject}|${reply.date}`
    if (!seen.has(key)) {
      seen.add(key)
      deduped.push(reply)
    }
  }
  if (deduped.length) appendJson(REPLIES_PATH, deduped)
  console.log(`IMAP reply poll: ${deduped.length} new replies`)
  return deduped
}

async function sendCounselorBatch(drafts) {
  const send = Boolean(arg('send'))
  if (!send) {
    console.log('Dry run: pass --send to send counselor batch')
    return
  }
  const delayMs = Number(arg('delay-seconds', 180)) * 1000
  const sentLog = readJson(SENT_PATH, [])
  const alreadySent = new Set(sentLog.filter((entry) => entry.kind === 'counselor' && entry.status === 'sent').map((entry) => entry.profile_id))
  const entries = []

  await verify()
  for (let i = 0; i < drafts.length; i += 1) {
    const draft = drafts[i]
    if (alreadySent.has(draft.id)) {
      console.log(`Skipping already-sent counselor ${i + 1}/10: ${draft.name}`)
      continue
    }
    const email = buildEmail(draft.paragraphs)
    try {
      const info = await sendMail({
        from: `"${BRAND.name}" <${BRAND.email}>`,
        to: draft.email,
        subject: draft.subject,
        ...email,
      })
      const status = info.rejected?.length ? 'rejected' : 'sent'
      entries.push({
        kind: 'counselor',
        profile_id: draft.id,
        name: draft.name,
        email: draft.email,
        city: draft.city,
        slug: draft.slug,
        sent_at: nowIso(),
        status,
        messageId: info.messageId,
        accepted: info.accepted || [],
        rejected: info.rejected || [],
      })
      appendJson(SENT_PATH, entries.splice(0))
      console.log(`Counselor send ${i + 1}/10 ${status}: ${draft.name}`)
    } catch (error) {
      appendJson(SENT_PATH, [{
        kind: 'counselor',
        profile_id: draft.id,
        name: draft.name,
        email: draft.email,
        city: draft.city,
        slug: draft.slug,
        sent_at: nowIso(),
        status: 'error',
        error: error.message,
      }])
      console.error(`Counselor send ${i + 1}/10 failed: ${draft.name}: ${error.message}`)
    }

    await monitorReplies(new Date(Date.now() - ONE_DAY_MS))
    if (i < drafts.length - 1) {
      const seconds = Math.round(delayMs / 1000)
      console.log(`Waiting ${seconds}s before next send`)
      const step = 30 * 1000
      let remaining = delayMs
      while (remaining > 0) {
        const chunk = Math.min(step, remaining)
        await sleep(chunk)
        remaining -= chunk
        if (remaining > 0) console.log(`Still throttling: ${Math.round(remaining / 1000)}s remaining`)
      }
    }
  }
}

async function main() {
  const supabase = createSupabase()
  const selection = await selectWarm10(supabase)
  if (selection.length !== 10) throw new Error('Selection did not produce 10 profiles')
  const updateSummaries = await backupAndUpdateProfiles(supabase)
  const drafts = await buildAndReviewDrafts(supabase, updateSummaries)
  await sendProofRecord(drafts)
  await monitorReplies(new Date(Date.now() - ONE_DAY_MS))
  await sendCounselorBatch(drafts)
  await monitorReplies(new Date(Date.now() - ONE_DAY_MS))
}

main().catch((error) => {
  console.error('FAILED:', error.message)
  process.exit(1)
})
