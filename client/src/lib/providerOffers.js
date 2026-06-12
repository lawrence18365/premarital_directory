export const CONTACT_EMAIL = 'hello@weddingcounselors.com'
export const FOUNDING_PAGE_PATH = '/for-providers/founding'
const upgradeMode = process.env.REACT_APP_UPGRADE_MODE === 'subscription' ? 'subscription' : 'one_time'

export const FOUNDING_PAYMENT_LINKS = {
  'founding-listing': process.env.REACT_APP_FOUNDING_LINK_LISTING || '',
  'founding-pro': process.env.REACT_APP_FOUNDING_LINK_PRO || '',
  'city-category-sponsor': process.env.REACT_APP_FOUNDING_LINK_SPONSOR || '',
}

export const UPGRADE_OFFER = {
  mode: upgradeMode,
  label: upgradeMode === 'subscription' ? 'Featured Listing' : 'Founding Listing',
  price: process.env.REACT_APP_UPGRADE_PRICE || (upgradeMode === 'subscription' ? '$49' : '$79'),
  billingNote: process.env.REACT_APP_UPGRADE_BILLING_NOTE || (upgradeMode === 'subscription' ? 'monthly, cancel anytime' : 'one-time founding placement'),
  checkoutUrl: process.env.REACT_APP_UPGRADE_CHECKOUT_URL || FOUNDING_PAYMENT_LINKS['founding-listing'] || '',
  valueProps: [
    'Featured placement in your city',
    'Professional profile polish',
    'More visibility while the directory is early'
  ]
}

const CONTACT_TYPES = new Set(['general', 'couple', 'professional', 'support', 'partnership'])

const createContactPath = ({ type = 'professional', subject, message } = {}) => {
  const params = new URLSearchParams()

  if (CONTACT_TYPES.has(type)) {
    params.set('type', type)
  }

  if (subject) {
    params.set('subject', subject)
  }

  if (message) {
    params.set('message', message)
  }

  return `/contact?${params.toString()}`
}

const createMailto = ({ subject, body } = {}) => {
  const search = new URLSearchParams()

  if (subject) {
    search.set('subject', subject)
  }

  if (body) {
    search.set('body', body)
  }

  const query = search.toString()
  return `mailto:${CONTACT_EMAIL}${query ? `?${query}` : ''}`
}

const defaultInquiry = {
  subject: 'Founding provider application',
  message: [
    'Hi,',
    '',
    'I want to apply as a founding featured provider.',
    '',
    'My primary city or market:',
    'My primary specialty or method:',
    'I am currently accepting new couples:',
    '',
    'Please send the next steps.'
  ].join('\n')
}

export const FOUNDING_PACKAGES = [
  {
    id: 'founding-listing',
    name: 'Founding Listing',
    price: '$79',
    priceSuffix: 'one-time',
    highlight: false,
    summary: 'A fast lift for providers who want cleaner positioning and one featured placement while the directory grows.',
    duration: '60-day featured visibility',
    features: [
      'Founding badge on your profile',
      'Profile cleanup for services, formats, and method tags',
      'Featured placement in one approved city or specialty',
      'Included in the founding provider roster'
    ],
    cta: 'Apply for Founding Listing',
    contactSubject: 'Founding Listing application',
    contactMessage: [
      'Hi,',
      '',
      'I want to apply for the Founding Listing package ($79 one-time).',
      '',
      'My primary city or market:',
      'My primary specialty or method:',
      'I am currently accepting new couples:',
      '',
      'Please send the next steps.'
    ].join('\n')
  },
  {
    id: 'founding-pro',
    name: 'Founding Pro',
    price: '$149',
    priceSuffix: 'one-time',
    highlight: true,
    summary: 'The strongest option for providers who want better copy, tighter positioning, and more prominent early visibility.',
    duration: '90-day featured visibility',
    features: [
      'Everything in Founding Listing',
      'Full profile rewrite for conversion',
      'Sharper specialty positioning by faith, method, and format',
      'Priority consideration in manual match shortlists'
    ],
    cta: 'Apply for Founding Pro',
    contactSubject: 'Founding Pro application',
    contactMessage: [
      'Hi,',
      '',
      'I want to apply for the Founding Pro package ($149 one-time).',
      '',
      'My primary city or market:',
      'My primary specialty or method:',
      'I am currently accepting new couples:',
      '',
      'Please send the next steps.'
    ].join('\n')
  },
  {
    id: 'city-category-sponsor',
    name: 'City / Category Sponsor',
    price: '$299',
    priceSuffix: 'one-time',
    highlight: false,
    summary: 'Reserved for providers who want an exclusive sponsor slot in one city or specialty with the highest-touch setup.',
    duration: 'Extended sponsor placement',
    features: [
      'Everything in Founding Pro',
      'Exclusive sponsor slot in one approved city or category',
      'Featured callout placement on the target page',
      'Priority routing for qualified referrals when available'
    ],
    cta: 'Apply for Sponsor Slot',
    contactSubject: 'City / Category Sponsor application',
    contactMessage: [
      'Hi,',
      '',
      'I want to apply for the City / Category Sponsor package ($299 one-time).',
      '',
      'My target city or category:',
      'My specialty or method:',
      'I am currently accepting new couples:',
      '',
      'Please send the next steps.'
    ].join('\n')
  }
]

export const DIRECTORY_PLAN_DETAILS = {
  community: {
    name: 'Community',
    price: 'Free',
    description: 'Your listing is live in the directory and couples can contact you directly.',
    features: [
      'Listed in relevant city and specialty pages',
      'Basic profile with contact information and bio',
      'Couples contact you directly',
      'Basic analytics in your dashboard'
    ]
  },
  local_featured: {
    name: 'Local Featured',
    price: 'Managed',
    description: 'Your enhanced placement is being managed manually by the Wedding Counselors team.',
    features: [
      'Enhanced profile treatment in one target market',
      'Priority placement where approved',
      'Manual profile optimization support',
      'Managed directly by support'
    ]
  },
  area_spotlight: {
    name: 'Area Spotlight',
    price: 'Managed',
    description: 'Your broader sponsor-style placement is managed directly by the Wedding Counselors team.',
    features: [
      'Expanded placement across a larger target area',
      'Priority visibility in approved sponsor surfaces',
      'Manual reporting and placement support',
      'Managed directly by support'
    ]
  }
}

DIRECTORY_PLAN_DETAILS.featured = DIRECTORY_PLAN_DETAILS.local_featured
DIRECTORY_PLAN_DETAILS.premium = DIRECTORY_PLAN_DETAILS.area_spotlight

export const buildFoundingInquiryPath = (pkg = null) => {
  if (!pkg) {
    return createContactPath(defaultInquiry)
  }

  return createContactPath({
    type: 'professional',
    subject: pkg.contactSubject,
    message: pkg.contactMessage
  })
}

export const buildFoundingMailto = (pkg = null) => {
  if (!pkg) {
    return createMailto({
      subject: defaultInquiry.subject,
      body: defaultInquiry.message
    })
  }

  return createMailto({
    subject: pkg.contactSubject,
    body: pkg.contactMessage
  })
}

export const getFoundingPaymentLink = (pkgOrId = 'founding-listing') => {
  const id = typeof pkgOrId === 'string' ? pkgOrId : pkgOrId?.id
  return FOUNDING_PAYMENT_LINKS[id] || ''
}
