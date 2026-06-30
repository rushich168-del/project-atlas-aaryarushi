import React from 'react'
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  FileCheck2,
  FileCog,
  FileText,
  GraduationCap,
  HeartPulse,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Presentation,
  RefreshCw,
  School,
  ShieldCheck,
  Table2,
  Users,
  Workflow,
} from 'lucide-react'
import { motion } from 'framer-motion'

const auditMail =
  'mailto:aaryarushi7@gmail.com?subject=Free%2020-Min%20Automation%20Audit'

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

const trustTags = ['Microsoft Office', 'Word', 'Excel', 'PDF', 'VBA', 'Workflow Automation']

const painCards = [
  ['Copy', ClipboardCheck],
  ['Paste', FileText],
  ['Rename', RefreshCw],
  ['Save', FileCheck2],
  ['Export PDF', FileCog],
  ['Repeat', Workflow],
  ['Manual Errors', ShieldCheck],
]

const solutions = [
  {
    title: 'Certificate Automation',
    icon: BadgeCheck,
    problem: 'Teams manually prepare certificates one by one from spreadsheet data.',
    solution: 'Generate certificates from Excel data using approved Word templates.',
    benefit: 'Faster batches, cleaner formatting, and repeatable output.',
  },
  {
    title: 'Excel Automation',
    icon: Table2,
    problem: 'Reports depend on repeated formulas, filtering, cleaning, and copying.',
    solution: 'Build structured Excel workflows, reports, and validation steps.',
    benefit: 'Less manual effort and better reporting consistency.',
  },
  {
    title: 'Document Automation',
    icon: FileText,
    problem: 'Business documents are recreated manually with repeated details.',
    solution: 'Use templates and data fields to generate documents reliably.',
    benefit: 'Professional documents with fewer formatting issues.',
  },
  {
    title: 'Office Workflow Automation',
    icon: Workflow,
    problem: 'Daily office tasks move across files without a clear process.',
    solution: 'Connect data, templates, outputs, and logs into one workflow.',
    benefit: 'Clearer execution and easier handover between team members.',
  },
  {
    title: 'PDF Automation',
    icon: FileCog,
    problem: 'PDF exports are handled manually after each document is prepared.',
    solution: 'Automate PDF creation from approved Word or Office outputs.',
    benefit: 'Standardized files ready for sharing and storage.',
  },
  {
    title: 'Custom Business Automation',
    icon: Code2,
    problem: 'Every team has small manual processes that standard tools miss.',
    solution: 'Design focused automation around the actual business workflow.',
    benefit: 'Practical improvement without unnecessary software complexity.',
  },
]

const industries = [
  ['Schools', School],
  ['Colleges', GraduationCap],
  ['Training Institutes', Presentation],
  ['HR Agencies', Users],
  ['Recruitment Firms', BriefcaseBusiness],
  ['Consultants', Building2],
  ['Small Businesses', BriefcaseBusiness],
  ['Healthcare', HeartPulse],
  ['Event Organizers', MapPin],
  ['Corporate Offices', Building2],
]

const processSteps = [
  'Free Consultation',
  'Requirement Analysis',
  'Proposal',
  'Development',
  'Testing',
  'Delivery',
  'Support',
]

function Section({ id, eyebrow, title, children, className = '', tone = 'light' }) {
  const eyebrowClass = tone === 'dark' ? 'text-accentTeal' : 'text-accentBlue'
  const titleClass = tone === 'dark' ? 'text-white' : 'text-primary'

  return (
    <section id={id} className={`px-5 py-16 sm:px-6 lg:px-8 lg:py-24 ${className}`}>
      <div className="mx-auto max-w-7xl">
        {(eyebrow || title) && (
          <motion.div
            className="mx-auto mb-10 max-w-3xl text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            transition={{ duration: 0.45 }}
          >
            {eyebrow && (
              <p className={`mb-3 text-sm font-semibold uppercase tracking-[0.16em] ${eyebrowClass}`}>
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className={`text-3xl font-semibold sm:text-4xl ${titleClass}`}>{title}</h2>
            )}
          </motion.div>
        )}
        {children}
      </div>
    </section>
  )
}

function ButtonLink({ href, children, variant = 'primary' }) {
  const classes =
    variant === 'primary'
      ? 'bg-primary text-white shadow-soft hover:bg-slate-800'
      : 'border border-slate-200 bg-white text-primary hover:border-slate-300 hover:bg-lightBg'

  return (
    <a
      href={href}
      className={`focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold transition ${classes}`}
    >
      {children}
    </a>
  )
}

function HeroScene() {
  const workflowSteps = [
    ['01', 'Excel Data', 'Rows validated'],
    ['02', 'Word Template', 'Fields mapped'],
    ['03', 'Generate Documents', 'Batch active'],
    ['04', 'DOCX + PDF Output', 'Files prepared'],
    ['05', 'Success Logs', 'Completed'],
  ]

  return (
    <motion.div
      className="relative mx-auto w-full max-w-[580px]"
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.15 }}
      aria-label="AR Automation Engine dashboard mockup"
    >
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-accentBlue/12 via-white to-accentTeal/12 blur-2xl" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">AR Automation Engine</p>
              <p className="mt-1 text-xs text-slate-500">Word, Excel, PDF workflow control</p>
            </div>
            <span className="inline-flex w-fit items-center rounded-md bg-accentTeal/10 px-3 py-1.5 text-xs font-semibold text-teal-700">
              Ready
            </span>
          </div>
        </div>

        <div className="bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.08),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.1),transparent_28%)] p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_0.72fr]">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Main Workflow
                </p>
                <span className="text-xs font-semibold text-accentBlue">5 steps</span>
              </div>
              <div className="grid gap-2">
                {workflowSteps.map(([number, title, detail]) => (
                  <div key={title} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-lightBg px-3 py-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-xs font-semibold text-accentBlue shadow-sm">
                      {number}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-primary">{title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-primary">300 Certificates Generated</p>
                  <span className="text-xs font-semibold text-accentTeal">100%</span>
                </div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-accentBlue to-accentTeal"
                    initial={{ width: '28%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500">Success</p>
                  <p className="mt-2 text-3xl font-semibold text-primary">300</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500">Failed</p>
                  <p className="mt-2 text-3xl font-semibold text-primary">0</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-4">
                  <FileText className="text-accentBlue" size={22} aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-primary">DOCX</p>
                  <p className="mt-1 text-xs text-slate-500">editable output</p>
                </div>
                <div className="rounded-xl border border-teal-100 bg-teal-50/80 p-4">
                  <FileCheck2 className="text-accentTeal" size={22} aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-primary">PDF</p>
                  <p className="mt-1 text-xs text-slate-500">ready to share</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
function PainCard({ label, icon: Icon, index }) {
  return (
    <motion.div
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      transition={{ duration: 0.35, delay: index * 0.04 }}
    >
      <Icon className="mb-5 text-accentBlue" size={24} aria-hidden="true" />
      <p className="font-semibold text-primary">{label}</p>
    </motion.div>
  )
}

function SolutionCard({ title, icon: Icon, problem, solution, benefit }) {
  return (
    <motion.article
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={fadeUp}
      transition={{ duration: 0.4 }}
    >
      <Icon className="text-accentTeal" size={28} aria-hidden="true" />
      <h3 className="mt-5 text-xl font-semibold text-primary">{title}</h3>
      <p className="mt-4 text-sm font-semibold text-slate-500">Problem</p>
      <p className="mt-1 leading-7">{problem}</p>
      <p className="mt-4 text-sm font-semibold text-slate-500">Solution</p>
      <p className="mt-1 leading-7">{solution}</p>
      <p className="mt-4 text-sm font-semibold text-slate-500">Business Benefit</p>
      <p className="mt-1 leading-7">{benefit}</p>
    </motion.article>
  )
}

function IconGrid({ items }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map(([label, Icon]) => (
        <div key={label} className="flex items-center gap-3 rounded-lg border border-slate-200 p-4">
          <Icon className="text-accentBlue" size={22} aria-hidden="true" />
          <span className="font-semibold text-primary">{label}</span>
        </div>
      ))}
    </div>
  )
}

function ProcessGrid({ steps }) {
  return (
    <div className="grid gap-4 md:grid-cols-7">
      {steps.map((step, index) => (
        <div key={step} className="rounded-lg border border-slate-200 bg-white p-5">
          <span className="text-sm font-semibold text-accentBlue">0{index + 1}</span>
          <p className="mt-4 font-semibold text-primary">{step}</p>
        </div>
      ))}
    </div>
  )
}

function ContactLinks({ light = false }) {
  const color = light ? 'text-white hover:text-accentTeal' : 'text-primary hover:text-accentBlue'

  return (
    <div className="grid gap-4 text-sm">
      <a className={`focus-ring flex items-center gap-3 rounded-md ${color}`} href="tel:+918374686037">
        <Phone size={18} /> +91 83746 86037
      </a>
      <a className={`focus-ring flex items-center gap-3 rounded-md ${color}`} href="mailto:aaryarushi7@gmail.com">
        <Mail size={18} /> aaryarushi7@gmail.com
      </a>
      <a className={`focus-ring flex items-center gap-3 rounded-md ${color}`} href="mailto:rushich168@gmail.com">
        <Mail size={18} /> rushich168@gmail.com
      </a>
      <a className={`focus-ring flex items-center gap-3 rounded-md ${color}`} href="https://linkedin.com/in/aaryarushi">
        <Linkedin size={18} /> linkedin.com/in/aaryarushi
      </a>
    </div>
  )
}

function App() {
  return (
    <main className="min-h-screen bg-white font-sans text-slateText">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200/70 bg-white/86 px-5 backdrop-blur sm:px-6 lg:px-8">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between">
          <a href="#top" className="focus-ring rounded-md text-sm font-bold text-primary">
            AaryaRushi Automation Labs
          </a>
          <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#solutions" className="hover:text-primary">Solutions</a>
            <a href="#ar-cert-pro" className="hover:text-primary">AR-CERT-PRO</a>
            <a href="#process" className="hover:text-primary">Process</a>
            <a href="#contact" className="hover:text-primary">Contact</a>
          </div>
          <a
            href={auditMail}
            className="focus-ring inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Book Audit
          </a>
        </nav>
      </header>

      <section id="top" className="hero-scene relative overflow-hidden px-5 pt-28 sm:px-6 lg:px-8">
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 pb-16 pt-10 sm:pt-14 lg:min-h-[680px] lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:pb-20">
          <motion.div
            className="max-w-3xl"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.55 }}
          >
            <p className="mb-5 inline-flex rounded-md border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-accentBlue backdrop-blur">
              Office Automation Solutions
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-primary sm:text-6xl lg:text-6xl">
              Office Automation Solutions for{' '}
              <span className="bg-gradient-to-r from-accentBlue to-accentTeal bg-clip-text text-transparent">
                Growing Businesses
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slateText sm:text-xl">
              Save hours of repetitive Microsoft Office work with intelligent Word,
              Excel, PDF, and document automation.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={auditMail}>
                Book Free 20-Min Automation Audit <ArrowRight size={18} />
              </ButtonLink>
              <ButtonLink href="#solutions" variant="secondary">
                View Solutions
              </ButtonLink>
            </div>
            <div className="mt-8 flex max-w-3xl flex-wrap gap-2">
              {trustTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-slate-200 bg-white/82 px-3 py-2 text-sm font-medium text-slate-600 backdrop-blur"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
          <HeroScene />
        </div>
      </section>

      <Section id="problem" eyebrow="Problem" title="Still Doing This Every Week?">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {painCards.map(([label, Icon], index) => (
            <PainCard key={label} label={label} icon={Icon} index={index} />
          ))}
        </div>
      </Section>

      <Section id="solutions" eyebrow="Solutions" title="Automation Built Around Real Office Work" className="bg-lightBg">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {solutions.map((solution) => (
            <SolutionCard key={solution.title} {...solution} />
          ))}
        </div>
      </Section>

      <Section id="ar-cert-pro" eyebrow="Featured Solution" title="AR-CERT-PRO">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.95fr]">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            transition={{ duration: 0.45 }}
          >
            <p className="text-lg leading-8">
              AR-CERT-PRO turns certificate generation into a repeatable local
              workflow: Excel data to Word template to DOCX output to PDF export to
              logs.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                'Batch certificate generation',
                'Template-based',
                'Local processing',
                'PDF output',
                'Logging',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-md border border-slate-200 p-4">
                  <CheckCircle2 className="text-accentTeal" size={20} aria-hidden="true" />
                  <span className="font-medium text-primary">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div
            className="rounded-lg border border-slate-200 bg-lightBg p-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            {['Excel Data', 'Word Template', 'DOCX Output', 'PDF Export', 'Logs'].map((step, index) => (
              <div key={step} className="flex items-center gap-4 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white p-4">
                  <p className="font-semibold text-primary">{step}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </Section>

      <Section id="industries" eyebrow="Industries" title="Where Office Automation Creates Immediate Clarity">
        <IconGrid items={industries} />
      </Section>

      <Section id="process" eyebrow="Process" title="A Clear Path from Manual Work to Automation" className="bg-lightBg">
        <ProcessGrid steps={processSteps} />
      </Section>

      <Section id="about" eyebrow="About" title="Practical Automation for Real Office Teams">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-lg leading-8">
            AaryaRushi Automation Labs was started with the belief that teams
            should spend time on decisions, not repetitive office work. We build
            practical automation solutions that simplify daily business operations.
          </p>
        </div>
      </Section>

      <Section id="contact" eyebrow="Contact" title="Ready to Eliminate Repetitive Office Work?" className="bg-primary text-white" tone="dark">
        <div className="grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            transition={{ duration: 0.45 }}
          >
            <p className="max-w-2xl text-lg leading-8 text-slate-200">
              Start with one workflow. We will review the current process and suggest
              a practical automation path focused on getting useful work into production.
            </p>
            <div className="mt-8">
              <a
                href={auditMail}
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-primary transition hover:bg-slate-100"
              >
                Book Free 20-Min Automation Audit <ArrowRight size={18} />
              </a>
            </div>
          </motion.div>
          <div className="rounded-lg border border-white/12 bg-white/[0.06] p-6">
            <ContactLinks light />
          </div>
        </div>
      </Section>

      <footer className="border-t border-slate-200 bg-lightBg px-5 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-lg font-bold text-primary">AaryaRushi Automation Labs</p>
            <p className="mt-3 max-w-xl leading-7">
              Office automation solutions for Word, Excel, PDF, and business
              workflows. Website: Coming soon / current deployment link placeholder.
            </p>
          </div>
          <div className="text-sm text-slate-500 lg:text-right">
            <p>Project Atlas v1.0</p>
            <p className="mt-2">Built for fast deployment and first-client conversion.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

export default App
