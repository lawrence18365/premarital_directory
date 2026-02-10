export const CATHOLIC_TRADITION = 'Catholic'
export const MIN_VERIFIED_PROGRAMS_FOR_INDEX = 3

export const isCatholicSpecialty = (specialty) => specialty?.slug === 'catholic'

export const buildCatholicProgramsQuery = (supabase) =>
  supabase
    .from('program_directory_public')
    .select('*')
    .eq('tradition', CATHOLIC_TRADITION)

const toTitleCase = (value) =>
  String(value || '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase())

export const normalizeProgramRecord = (record) => {
  const requirementsRaw = record?.requirements_json
  const requirementList = Array.isArray(requirementsRaw?.items)
    ? requirementsRaw.items
    : Array.isArray(requirementsRaw)
      ? requirementsRaw
      : []

  return {
    id: record?.id,
    name: record?.program_name || 'Catholic Marriage Preparation Program',
    tradition: record?.tradition || CATHOLIC_TRADITION,
    programType: record?.program_type ? toTitleCase(record.program_type) : null,
    format: record?.format ? toTitleCase(record.format) : null,
    cost: record?.cost || null,
    sessionCount: Number(record?.session_count) > 0 ? Number(record.session_count) : null,
    timeline: record?.timeline || null,
    registrationUrl: record?.registration_url || null,
    languages: Array.isArray(record?.languages) ? record.languages.filter(Boolean) : [],
    requirementList: requirementList.filter(Boolean),
    nextStartDate: record?.next_start_date || null,
    summary: record?.summary || null,
    allowLeadForm: Boolean(record?.allow_lead_form),
    church: {
      id: record?.church_id,
      name: record?.church_name || 'Parish',
      addressLine1: record?.address_line1 || null,
      addressLine2: record?.address_line2 || null,
      city: record?.city || null,
      stateProvince: record?.state_province || null,
      postalCode: record?.postal_code || null,
      website: record?.website || null,
      officePhone: record?.office_phone || null
    }
  }
}
