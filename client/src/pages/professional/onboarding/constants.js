// Field options reused from CreateProfilePage.js
// Centralized here for the onboarding flow

export const professionOptions = [
  // Licensed Professionals
  { value: 'Marriage & Family Therapist', label: 'Marriage & Family Therapist (LMFT)', category: 'licensed' },
  { value: 'Licensed Professional Counselor', label: 'Licensed Professional Counselor (LPC)', category: 'licensed' },
  { value: 'Licensed Clinical Social Worker', label: 'Licensed Clinical Social Worker (LCSW)', category: 'licensed' },
  { value: 'Psychologist', label: 'Psychologist (PhD/PsyD)', category: 'licensed' },
  // Coaches & Facilitators
  { value: 'Premarital Coach', label: 'Premarital/Relationship Coach', category: 'coach' },
  { value: 'SYMBIS Facilitator', label: 'SYMBIS Facilitator', category: 'coach' },
  // Faith-Based
  { value: 'Pastor', label: 'Pastor/Minister', category: 'clergy' },
  { value: 'Priest', label: 'Priest/Deacon', category: 'clergy' },
  { value: 'Rabbi', label: 'Rabbi', category: 'clergy' },
  { value: 'Chaplain', label: 'Chaplain', category: 'clergy' },
  { value: 'Pre-Cana Instructor', label: 'Pre-Cana Instructor', category: 'clergy' },
  // Other
  { value: 'Wedding Officiant', label: 'Wedding Officiant (w/ Counseling)', category: 'other' }
]

export const sessionTypeOptions = [
  { value: 'in-person', label: 'In-Person', icon: 'fa-building' },
  { value: 'online', label: 'Online/Video', icon: 'fa-video-camera' },
  { value: 'hybrid', label: 'Both', icon: 'fa-exchange' }
]

export const specialtyOptions = [
  // Core premarital topics
  'Communication Skills',
  'Conflict Resolution',
  'Financial Planning',
  'Intimacy & Sexuality',
  'Family Planning',
  // Relationship types
  'Blended Families',
  'Second Marriages',
  'Interfaith Couples',
  'Intercultural Couples',
  'Long-Distance Relationships',
  'Military Couples',
  'LGBTQ+ Affirming',
  // Special circumstances
  'Anxiety About Marriage',
  'In-Law Relationships',
  'Career/Work-Life Balance',
  'Trauma-Informed',
  // Faith-specific
  'Faith-Based Counseling',
  'Natural Family Planning (NFP)',
  'Catholic Marriage Prep'
]

export const certificationOptions = [
  'SYMBIS Certified',
  'PREPARE/ENRICH Certified',
  'Gottman Certified Therapist',
  'FOCCUS Trained',
  'Emotionally Focused (EFT) Certified',
  'Twogether in Texas Provider',
  'Pre-Cana Certified',
  'Marriage License Discount Provider'
]

export const faithTraditionOptions = [
  { value: 'secular', label: 'Secular/Non-religious' },
  { value: 'christian', label: 'Christian (Non-denominational)' },
  { value: 'catholic', label: 'Catholic' },
  { value: 'protestant', label: 'Protestant' },
  { value: 'jewish', label: 'Jewish' },
  { value: 'muslim', label: 'Muslim' },
  { value: 'interfaith', label: 'Interfaith Specialist' },
  { value: 'all-faiths', label: 'All Faiths Welcome' }
]

export const yearsOptions = [
  { value: '1', label: 'Less than 1 year' },
  { value: '3', label: '1-3 years' },
  { value: '5', label: '4-6 years' },
  { value: '10', label: '7-10 years' },
  { value: '15', label: '10-15 years' },
  { value: '20', label: '15+ years' }
]

export const treatmentApproachOptions = [
  // Evidence-based assessments
  'SYMBIS Assessment',
  'PREPARE/ENRICH',
  'FOCCUS Inventory',
  // Therapeutic approaches
  'Gottman Method',
  'Emotionally Focused (EFT)',
  'Cognitive Behavioral (CBT)',
  'Solution-Focused',
  'Attachment-Based',
  // Faith-based programs
  'Catholic Pre-Cana',
  'Faith-Based Counseling',
  'Twogether in Texas'
]

export const clientFocusOptions = [
  'Engaged Couples',
  'Newly Engaged',
  'Planning Wedding Soon',
  'Newlyweds (First Year)',
  'Young Adults (20s)',
  'Adults (30s-40s)',
  'Second Marriages',
  'Previously Divorced',
  'Blended Families',
  'LGBTQ+ Couples',
  'Interfaith Couples',
  'Intercultural Couples',
  'Military/First Responders',
  'Long-Distance Couples'
]

export const insuranceOptions = [
  'Aetna',
  'Anthem',
  'Blue Cross Blue Shield',
  'Cigna',
  'Humana',
  'Kaiser Permanente',
  'Magellan Health',
  'Medicare',
  'Medicaid',
  'Optum / UnitedHealthcare',
  'Tricare',
  'Out-of-Network'
]

export const paymentMethodOptions = [
  'Cash',
  'Check',
  'Visa / Mastercard',
  'American Express',
  'HSA / FSA',
  'PayPal / Venmo',
  'Zelle'
]

export const languageOptions = [
  'English',
  'Spanish',
  'French',
  'Mandarin',
  'Korean',
  'Vietnamese',
  'Arabic',
  'Portuguese',
  'German',
  'Hindi',
  'Tagalog',
  'Russian',
  'American Sign Language (ASL)'
]

export const pronounOptions = [
  { value: 'she/her', label: 'She/Her' },
  { value: 'he/him', label: 'He/Him' },
  { value: 'they/them', label: 'They/Them' }
]

// Total questions in the onboarding flow
export const TOTAL_QUESTIONS = 19

// Question metadata for tracking
export const QUESTION_METADATA = {
  1: { title: 'Name & Profession', required: true },
  2: { title: 'Professional Photo', required: true },
  3: { title: 'Location', required: true },
  4: { title: 'Session Types', required: true },
  5: { title: 'Practice Bio', required: true },
  6: { title: 'Contact Info', required: true },
  7: { title: 'Faith Tradition', required: false },
  8: { title: 'Certifications', required: false },
  9: { title: 'Specialties', required: false },
  10: { title: 'Therapeutic Approach', required: false },
  11: { title: 'Client Focus', required: false },
  12: { title: 'Experience & Pronouns', required: false },
  13: { title: 'Languages', required: false },
  14: { title: 'License & Credentials', required: false },
  15: { title: 'Education & Training', required: false },
  16: { title: 'Session Fees & Pricing', required: false },
  17: { title: 'Insurance Accepted', required: false },
  18: { title: 'Payment Methods', required: false },
  19: { title: 'Review & Publish', required: true }
}
