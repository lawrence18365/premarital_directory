import React, { useState } from 'react'
import {
  Button,
  Field,
  Card,
  Section,
  Container,
  Stack,
  EmptyState,
  ErrorState,
  LoadingState
} from '../components/ui'

/*
 * StyleguidePage
 *
 * Visual source of truth for the ui/ component library. Renders every
 * component, variant and state. Dev-only: App.js gates the route so it never
 * ships to production.
 */

const VARIANTS = ['primary', 'secondary', 'outline', 'ghost', 'destructive']
const SIZES = ['sm', 'md', 'lg']

const Swatch = ({ title, children }) => (
  <Card style={{ marginBottom: 'var(--space-6)' }}>
    <h3 style={{ marginBottom: 'var(--space-4)' }}>{title}</h3>
    {children}
  </Card>
)

const Row = ({ children }) => (
  <div
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 'var(--space-4)',
      alignItems: 'center',
      marginBottom: 'var(--space-4)'
    }}
  >
    {children}
  </div>
)

const StyleguidePage = () => {
  const [selectValue, setSelectValue] = useState('counselor')

  return (
    <Section>
      <Container size="lg">
        <h1 style={{ marginBottom: 'var(--space-2)' }}>UI Styleguide</h1>
        <p style={{ marginBottom: 'var(--space-12)' }}>
          Development-only visual reference for the ui/ component library.
        </p>

        {/* ---------------------------------------------------------------- Buttons */}
        <h2 style={{ marginBottom: 'var(--space-6)' }}>Button</h2>

        <Swatch title="Variants (medium)">
          <Row>
            {VARIANTS.map((v) => (
              <Button key={v} variant={v}>
                {v}
              </Button>
            ))}
          </Row>
        </Swatch>

        <Swatch title="Sizes (primary)">
          <Row>
            {SIZES.map((s) => (
              <Button key={s} variant="primary" size={s}>
                size {s}
              </Button>
            ))}
          </Row>
        </Swatch>

        <Swatch title="States">
          <Row>
            <Button variant="primary">Default</Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
            <Button variant="primary" loading>
              Loading
            </Button>
            <Button variant="outline" loading>
              Loading
            </Button>
            <Button variant="destructive" disabled>
              Disabled
            </Button>
          </Row>
        </Swatch>

        <Swatch title="Full width + as anchor">
          <Stack gap={3}>
            <Button variant="primary" fullWidth>
              Full width button
            </Button>
            <Button variant="outline" as="a" href="#button">
              Rendered as anchor
            </Button>
          </Stack>
        </Swatch>

        <Swatch title="Every variant x size matrix">
          {VARIANTS.map((v) => (
            <Row key={v}>
              {SIZES.map((s) => (
                <Button key={s} variant={v} size={s}>
                  {v} {s}
                </Button>
              ))}
            </Row>
          ))}
        </Swatch>

        {/* ---------------------------------------------------------------- Fields */}
        <h2 style={{ marginTop: 'var(--space-12)', marginBottom: 'var(--space-6)' }}>Field</h2>

        <Card>
          <Stack gap={4}>
            <Field
              label="Full name"
              id="sg-name"
              placeholder="Jane Counselor"
              required
              helperText="As it should appear on your profile."
            />
            <Field label="Email" id="sg-email" type="email" placeholder="you@practice.com" />
            <Field
              label="Email with error"
              id="sg-email-error"
              type="email"
              defaultValue="not-an-email"
              error="Enter a valid email address."
            />
            <Field
              label="Verified email"
              id="sg-email-success"
              type="email"
              defaultValue="hello@weddingcounselors.com"
              success
              helperText="Looks good."
            />
            <Field
              label="Bio"
              id="sg-bio"
              as="textarea"
              rows={4}
              placeholder="Tell couples about your approach..."
              helperText="A few sentences works best."
            />
            <Field
              label="Profession"
              id="sg-profession"
              as="select"
              value={selectValue}
              onChange={(e) => setSelectValue(e.target.value)}
              options={[
                { value: 'counselor', label: 'Counselor' },
                { value: 'therapist', label: 'Therapist' },
                { value: 'coach', label: 'Coach' },
                { value: 'clergy', label: 'Clergy' }
              ]}
            />
            <Field label="Disabled" id="sg-disabled" placeholder="Cannot edit" disabled />
          </Stack>
        </Card>

        {/* ---------------------------------------------------------------- Cards */}
        <h2 style={{ marginTop: 'var(--space-12)', marginBottom: 'var(--space-6)' }}>Card</h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-6)'
          }}
        >
          <Card variant="default">
            <h3>Default</h3>
            <p>Static surface with token-driven radius, border and shadow.</p>
          </Card>
          <Card variant="interactive" tabIndex={0}>
            <h3>Interactive</h3>
            <p>Hover for elevation. Focusable for keyboard users.</p>
          </Card>
          <Card variant="pricing">
            <h3>Pro</h3>
            <p>$29/mo</p>
            <Button variant="primary" fullWidth>
              Choose plan
            </Button>
          </Card>
          <Card variant="testimonial">
            <p>"Booked three couples in my first week on the directory."</p>
            <p>
              <strong>A. Counselor</strong>
            </p>
          </Card>
        </div>

        {/* ---------------------------------------------------------------- Layout */}
        <h2 style={{ marginTop: 'var(--space-12)', marginBottom: 'var(--space-6)' }}>
          Section / Container / Stack
        </h2>

        <Section muted style={{ borderRadius: 'var(--radius-lg)' }}>
          <Container size="sm">
            <Stack gap={3}>
              <h3>Muted Section + small Container + Stack</h3>
              <p>This block uses the muted section background and a narrow container.</p>
              <Button variant="outline">Action</Button>
            </Stack>
          </Container>
        </Section>

        {/* ---------------------------------------------------------------- States */}
        <h2 style={{ marginTop: 'var(--space-12)', marginBottom: 'var(--space-6)' }}>
          Empty / Error / Loading states
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-6)'
          }}
        >
          <Card>
            <EmptyState
              icon={<i className="fas fa-inbox" />}
              title="No leads yet"
              description="When couples reach out, their inquiries show up here."
              action={<Button variant="primary">Share your profile</Button>}
            />
          </Card>
          <Card>
            <ErrorState
              title="Could not load leads"
              description="Check your connection and try again."
              action={<Button variant="outline">Retry</Button>}
            />
          </Card>
          <Card>
            <LoadingState text="Loading leads..." description="Fetching the latest inquiries." />
          </Card>
        </div>
      </Container>
    </Section>
  )
}

export default StyleguidePage
