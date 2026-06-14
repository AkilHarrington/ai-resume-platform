import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { useIsMobile } from '../hooks/useIsMobile'

const LAST_UPDATED = 'June 13, 2025'
const CONTACT_EMAIL = 'privacy@airesumestudio.com'

interface SectionProps {
  title: string
  children: React.ReactNode
}

function Section({ title, children }: SectionProps) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{
        fontSize: 18, fontWeight: 800, color: 'var(--text-heading)',
        marginBottom: 12, paddingBottom: 10,
        borderBottom: '2px solid var(--border)',
      }}>
        {title}
      </h2>
      <div style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.8 }}>
        {children}
      </div>
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ marginBottom: 12 }}>{children}</p>
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
      {items.map((item, i) => (
        <li key={i} style={{ marginBottom: 6 }}>{item}</li>
      ))}
    </ul>
  )
}

export function PrivacyPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-page)', fontFamily: 'var(--font-sans)' }}>
      {/* Nav */}
      <nav style={{
        background: 'var(--surface-0)', borderBottom: '1px solid var(--border)',
        padding: '0 24px', height: 64, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <Logo size="sm" />
        <button
          onClick={() => navigate(-1)}
          style={{
            fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600,
            cursor: 'pointer', border: 'none', background: 'none',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          ← Back
        </button>
      </nav>

      {/* Content */}
      <div style={{
        maxWidth: 760, margin: '0 auto',
        padding: isMobile ? '32px 20px 60px' : '48px 24px 80px',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{
            fontSize: isMobile ? 28 : 36, fontWeight: 900,
            color: 'var(--text-heading)', letterSpacing: '-0.02em', marginBottom: 8,
          }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Last updated: {LAST_UPDATED}
          </p>
          <div style={{
            marginTop: 20, padding: '14px 18px',
            background: 'var(--surface-1)', borderRadius: 'var(--radius)',
            border: '1px solid var(--border-input)',
            fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6,
          }}>
            <strong>The short version:</strong> We collect your email, resume text, and payment info to run
            the service. We send your resume to Anthropic's Claude API for AI processing. We never sell
            your data. You can request deletion at any time.
          </div>
        </div>

        <Section title="1. Who We Are">
          <P>
            AI Resume Studio ("we," "us," or "our") is an AI-powered resume optimization service
            operated from Trinidad and Tobago. We help job seekers improve their resumes using
            artificial intelligence.
          </P>
          <P>
            This Privacy Policy explains how we collect, use, share, and protect your personal
            information when you use our website and services at{' '}
            <strong>airesumestudio.com</strong> (the "Service").
          </P>
          <P>
            This policy is governed by and compliant with the{' '}
            <strong>Data Protection Act, 2011 (Chapter 22:04)</strong> of Trinidad and Tobago.
          </P>
        </Section>

        <Section title="2. Information We Collect">
          <P><strong>Account information:</strong></P>
          <Ul items={[
            'Email address — used to create and manage your account',
            'Password — stored in hashed form by Supabase; we never see your plaintext password',
          ]} />

          <P><strong>Resume and career data you provide:</strong></P>
          <Ul items={[
            'Resume content (PDF file or extracted text) — work history, education, skills, contact details',
            'Job descriptions you paste for ATS scanning',
            'Target role and company name (optional, for cover letter generation)',
          ]} />

          <P><strong>Payment information:</strong></P>
          <Ul items={[
            'Payment card details — collected and processed directly by Stripe. We never store card numbers.',
            'Subscription status (Free or Pro) — stored in our database',
          ]} />

          <P><strong>Usage data collected automatically:</strong></P>
          <Ul items={[
            'Browser type, device type, and operating system',
            'Pages visited and features used within the Service',
            'IP address and approximate geographic location',
            'Session timestamps',
          ]} />
        </Section>

        <Section title="3. How We Use Your Information">
          <P>We use your information solely to provide and improve the Service:</P>
          <Ul items={[
            'To process your resume through our AI scoring and optimization features',
            'To generate cover letters and LinkedIn profile suggestions',
            'To manage your account, subscription, and billing',
            'To send transactional emails (account confirmation, receipts)',
            'To diagnose errors and improve the reliability of the Service',
            'To comply with legal obligations',
          ]} />
          <P>
            We do <strong>not</strong> use your resume data to train AI models. We do <strong>not</strong>{' '}
            send you marketing emails without your explicit consent. We do <strong>not</strong> sell
            your personal data to any third party.
          </P>
        </Section>

        <Section title="4. AI Processing — Anthropic Claude">
          <P>
            Our core features (ATS scoring, resume optimization, cover letter generation, LinkedIn
            optimization) are powered by{' '}
            <strong>Anthropic's Claude API</strong>. When you use these features, your resume text
            and job description are transmitted to Anthropic's servers for processing.
          </P>
          <P>
            Anthropic processes your data as a sub-processor under their{' '}
            <a
              href="https://www.anthropic.com/legal/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-heading)', fontWeight: 600 }}
            >
              Privacy Policy
            </a>
            {' '}and{' '}
            <a
              href="https://www.anthropic.com/legal/aup"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-heading)', fontWeight: 600 }}
            >
              Usage Policy
            </a>
            . By using our AI features, you acknowledge that your resume content will be processed
            by Anthropic.
          </P>
          <P>
            <strong>Important:</strong> Do not upload resumes containing highly sensitive information
            that you would not want processed by a third-party AI provider (e.g., classified
            security clearance details, medical history unrelated to your career).
          </P>
        </Section>

        <Section title="5. Third-Party Service Providers">
          <P>We share data with the following sub-processors to operate the Service:</P>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%', borderCollapse: 'collapse',
              fontSize: 14, marginBottom: 12,
            }}>
              <thead>
                <tr style={{ background: 'var(--surface-page)', textAlign: 'left' }}>
                  {['Provider', 'Purpose', 'Data Shared'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-heading)', borderBottom: '2px solid var(--gray-200)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Anthropic', 'AI resume processing', 'Resume text, job description'],
                  ['Supabase', 'Database & authentication', 'Email, subscription status, resume text'],
                  ['Stripe', 'Payment processing', 'Payment card details, billing email'],
                ].map(([provider, purpose, data], i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{provider}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{purpose}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <P>
            We do not share your data with any other third parties except where required by law.
          </P>
        </Section>

        <Section title="6. Data Retention">
          <Ul items={[
            'Account data: retained until you delete your account',
            'Resume text: retained while your account is active; deleted within 30 days of account deletion',
            'Payment records: retained for 7 years for tax and accounting compliance',
            'Usage logs: retained for up to 90 days for security and debugging',
          ]} />
        </Section>

        <Section title="7. Your Rights Under the T&T Data Protection Act">
          <P>
            Under the Data Protection Act 2011 of Trinidad and Tobago, you have the right to:
          </P>
          <Ul items={[
            'Access — request a copy of the personal data we hold about you',
            'Correction — request that inaccurate data be corrected',
            'Deletion — request that your personal data be deleted ("right to be forgotten")',
            'Restriction — request that we limit how we process your data',
            'Objection — object to processing based on legitimate interests',
            'Portability — receive your data in a structured, machine-readable format',
          ]} />
          <P>
            To exercise any of these rights, email us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--text-heading)', fontWeight: 600 }}>
              {CONTACT_EMAIL}
            </a>
            . We will respond within 30 days. We may ask you to verify your identity before
            processing your request.
          </P>
        </Section>

        <Section title="8. Cookies and Tracking">
          <P>
            We use essential cookies and browser storage required to keep you signed in and maintain
            your session. We do not use advertising cookies, tracking pixels, or analytics
            services that profile you across the web.
          </P>
          <P>
            You can disable cookies in your browser settings, but this will prevent you from
            staying signed in to your account.
          </P>
        </Section>

        <Section title="9. Data Security">
          <P>
            We implement industry-standard security measures to protect your data:
          </P>
          <Ul items={[
            'All data transmitted between your browser and our servers is encrypted using TLS (HTTPS)',
            'Passwords are hashed using bcrypt — we never store plaintext passwords',
            'API endpoints are protected by JWT authentication — your session token is verified on every request',
            'Database access is controlled by row-level security (RLS) — you can only access your own data',
            'Payment data is handled exclusively by Stripe (PCI-DSS compliant) — we never touch card numbers',
          ]} />
          <P>
            No method of transmission over the internet is 100% secure. If you discover a security
            vulnerability, please report it to {CONTACT_EMAIL}.
          </P>
        </Section>

        <Section title="10. Children's Privacy">
          <P>
            The Service is not intended for persons under the age of 16. We do not knowingly collect
            personal data from children. If you believe a child has provided us with personal data,
            please contact us and we will delete it promptly.
          </P>
        </Section>

        <Section title="11. International Data Transfers">
          <P>
            Our service providers (Anthropic, Supabase, Stripe) are based in the United States. By
            using the Service, you acknowledge that your data may be transferred to and processed in
            the United States, which may not have equivalent data protection laws to your country
            of residence. We take steps to ensure your data is protected through contractual
            safeguards with these providers.
          </P>
        </Section>

        <Section title="12. Changes to This Policy">
          <P>
            We may update this Privacy Policy from time to time. When we do, we will update the
            "Last updated" date at the top of this page and notify registered users by email for
            material changes. Continued use of the Service after changes are posted constitutes
            your acceptance of the updated policy.
          </P>
        </Section>

        <Section title="13. Contact Us">
          <P>
            If you have questions about this Privacy Policy or wish to exercise your data rights,
            please contact us:
          </P>
          <div style={{
            background: 'var(--surface-0)', borderRadius: 'var(--radius)', padding: '20px 24px',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
          }}>
            <p style={{ fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>AI Resume Studio</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
              Trinidad and Tobago<br />
              Email:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--text-heading)', fontWeight: 600 }}>
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </Section>
      </div>

      {/* Footer */}
      <footer style={{ background: 'var(--navy-dark)', padding: '28px 20px', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
          © {new Date().getFullYear()} AI Resume Studio. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
