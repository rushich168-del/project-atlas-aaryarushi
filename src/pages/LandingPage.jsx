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

const auditFormLink =
  'https://docs.google.com/forms/d/e/1FAIpQLSfs7Uwy60Yiuc6PfuumByH3g08MMkJLe1Z4ddNFQgb-UE2bhQ/viewform?usp=header'
const primaryEmailLink =
  'https://mail.google.com/mail/?view=cm&fs=1&to=aaryarushi7@gmail.com'
const secondaryEmailLink =
  'https://mail.google.com/mail/?view=cm&fs=1&to=rushich168@gmail.com'

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

const productSuiteGroups = [
  {
    title: 'Education Suite',
    description: 'Document automation workflows for academic teams and institute operations.',
    products: [
      { name: 'AR-CERT-PRO', status: 'Ready to use', action: 'Open Workspace', href: '/dashboard/products/ar-cert-pro/workspace', description: 'Certificate DOCX generation from Excel data and Word templates.' },
      { name: 'AR-MARKSHEET-PRO', status: 'Workspace setup', action: 'Request Setup', href: '/dashboard/products/ar-marksheet-pro', description: 'Structured marksheet document workflow prepared for setup.' },
      { name: 'AR-REPORT-PRO', status: 'Workspace setup', action: 'Request Setup', href: '/dashboard/products/ar-report-pro', description: 'Student report and progress document workflow prepared for setup.' },
      { name: 'AR-WORKSHEET-PRO', status: 'Workspace setup', action: 'Request Setup', href: '/dashboard/products/ar-worksheet-pro', description: 'Classroom worksheet and practice document workflow prepared for setup.' },
      { name: 'AR-QUESTION-PRO', status: 'Workspace setup', action: 'Request Setup', href: '/dashboard/products/ar-question-pro', description: 'Question paper, question sheet, and practice set workflow prepared for setup.' },
      { name: 'AR-IDCARD-PRO', status: 'Product workspace', action: 'Open Workspace', href: '/dashboard/products/ar-idcard-pro/workspace', description: 'Text-based student and employee ID card documents from Excel data and Word templates.' },
    ],
  },
  {
    title: 'HR / Admin Suite',
    description: 'Admin-ready document and communication preparation for people and operations teams.',
    products: [
      { name: 'AR-IDCARD-PRO', status: 'Product workspace', action: 'Open Workspace', href: '/dashboard/products/ar-idcard-pro/workspace', description: 'Text-based student and employee ID card documents. Photo areas stay manual in the template.' },
      { name: 'AR-MAIL-PRO', status: 'Mail preparation', action: 'Open Product', href: '/dashboard/products/ar-mail-pro', description: 'Mail preparation workspace with dry-run validation only. No real row-recipient emails are sent.' },
    ],
  },
  {
    title: 'Office / Business Suite',
    description: 'Repeatable document preparation for small businesses and admin teams.',
    products: [
      { name: 'AR-INVOICE-PRO', status: 'Workspace setup', action: 'Request Setup', href: '/dashboard/products/ar-invoice-pro', description: 'Invoice document workflow prepared for setup from spreadsheet data.' },
      { name: 'AR-FEE-RECEIPT-PRO', status: 'Request setup', action: 'Request Setup', href: '/dashboard/products/ar-fee-receipt-pro', description: 'Fee receipt document workspace can be scoped with the client before use.' },
    ],
  },
]

const trustBadges = [
  'DOCX Automation',
  'Excel-Based Generation',
  'Safe Email Preparation',
  'Product Suite Catalog',
  'Built for Education and Business',
]

const painCards = [
  ['Copy', ClipboardCheck],
  ['Paste', FileText],
  ['Rename', RefreshCw],
  ['Save', FileCheck2],
  ['Recheck', FileCog],
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
    title: 'Safe Email Preparation',
    icon: FileCog,
    problem: 'Teams need to review recipient lists and messages before sending anything.',
    solution: 'Prepare email content and run dry-run validation without sending real row-recipient emails.',
    benefit: 'Safer communication prep with clear recipient counts and safety checks.',
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
  'Upload Word Template',
  'Upload Excel Data',
  'Map Fields',
  'Preview',
  'Generate DOCX',
  'Review History',
  'Email Prep dry-run',
]

const workflowCards = [
  { label: 'Upload Word template', description: 'Start with the approved DOCX layout for the product workflow.' },
  { label: 'Upload Excel data', description: 'Load rows from the spreadsheet used by the school, office, or business team.' },
  { label: 'Map fields', description: 'Connect template placeholders to spreadsheet columns before generation.' },
  { label: 'Preview', description: 'Review one prepared row or output path before moving forward.' },
  { label: 'Generate DOCX', description: 'Create editable DOCX output where the workflow is available.' },
  { label: 'Review History', description: 'Use History to review prepared or generated outputs inside the dashboard.' },
  { label: 'Safe Email Prep dry-run', description: 'Optional email preparation uses dry-run validation only; no real row-recipient emails are sent.' },
]

const safetyStatements = [
  'Email Prep is dry-run only in Project Atlas.',
  'No real row-recipient emails are sent.',
  'Controlled batch sending remains disabled.',
  'Failed-row resend remains disabled.',
  'Gmail/Outlook OAuth is not connected.',
  'PDF export is not presented as available inside Project Atlas.',
]

function getStatusClass(status) {
  if (status === 'Ready to use') return 'bg-emerald-50 text-emerald-700'
  if (status === 'Mail preparation') return 'bg-teal-50 text-teal-700'
  if (status === 'Workspace setup') return 'bg-blue-50 text-blue-700'
  return 'bg-amber-50 text-amber-700'
}

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
      target={href === auditFormLink ? '_blank' : undefined}
      rel={href === auditFormLink ? 'noopener noreferrer' : undefined}
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
    ['04', 'DOCX Output', 'File prepared'],
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
              <p className="mt-1 text-xs text-slate-500">Word and Excel workflow control</p>
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
                  <p className="text-sm font-semibold text-primary">One Certificate Generated</p>
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
                  <p className="mt-2 text-3xl font-semibold text-primary">1</p>
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
                  <p className="mt-3 text-sm font-semibold text-primary">History</p>
                  <p className="mt-1 text-xs text-slate-500">stored output</p>
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
      <a
        className={`focus-ring flex items-center gap-3 rounded-md ${color}`}
        href={primaryEmailLink}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Mail size={18} /> aaryarushi7@gmail.com
      </a>
      <a
        className={`focus-ring flex items-center gap-3 rounded-md ${color}`}
        href={secondaryEmailLink}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Mail size={18} /> rushich168@gmail.com
      </a>
      <a className={`focus-ring flex items-center gap-3 rounded-md ${color}`} href="https://linkedin.com/in/aaryarushi">
        <Linkedin size={18} /> linkedin.com/in/aaryarushi
      </a>
    </div>
  )
}

function LandingPage() {
  return (
    <main className="min-h-screen bg-white font-sans text-slateText">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200/70 bg-white/86 px-5 backdrop-blur sm:px-6 lg:px-8">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between">
          <a href="#top" className="focus-ring rounded-md text-sm font-bold text-primary">
            AaryaRushi Automation Labs
          </a>
          <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#product-suite" className="hover:text-primary">Product Suite</a>
            <a href="#workflow" className="hover:text-primary">Workflow</a>
            <a href="#workspace-readiness" className="hover:text-primary">Readiness</a>
            <a href="#process" className="hover:text-primary">Process</a>
            <a href="/dashboard" className="hover:text-primary">Dashboard</a>
            <a href="#contact" className="hover:text-primary">Contact</a>
          </div>
          <a
            href={auditFormLink}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Book Audit
          </a>
        </nav>
      </header>

      <section id="top" className="relative overflow-hidden px-5 pt-28 sm:px-6 lg:px-8">
        <div className="relative mx-auto grid max-w-7xl gap-10 pb-14 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:pb-20">
          <motion.div
            className="max-w-3xl"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.55 }}
          >
            <p className="mb-5 inline-flex rounded-full border border-accentTeal/20 bg-accentTeal/10 px-3 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-accentTeal">
              AaryaRushi Automation Labs
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-primary sm:text-5xl lg:text-6xl">
              Document automation for schools, colleges, training institutes, and small businesses.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slateText sm:text-xl">
              Project Atlas presents a focused product suite for turning Word templates and Excel data into repeatable document workflows, with safe email preparation kept dry-run only.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/dashboard">
                Login / Open Dashboard
              </ButtonLink>
              <ButtonLink href="#product-suite" variant="secondary">
                See Product Suite
              </ButtonLink>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {trustBadges.map((badge) => (
                <div key={badge} className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
                  <p className="text-sm font-semibold text-primary">{badge}</p>
                </div>
              ))}
            </div>
          </motion.div>
          <HeroScene />
        </div>
      </section>

      <Section id="workflow" eyebrow="Workflow" title="How Project Atlas product workflows are staged">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {workflowCards.map((step, index) => (
            <div key={step.label} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accentBlue text-sm font-bold text-white">
                {index + 1}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-primary">{step.label}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="product-suite" eyebrow="Product suite" title="AaryaRushi Automation Labs product lineup">
        <div className="grid gap-5 lg:grid-cols-3">
          {productSuiteGroups.map((group) => (
            <article key={group.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <h3 className="text-xl font-semibold text-primary">{group.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{group.description}</p>
              </div>
              <div className="mt-5 grid gap-3">
                {group.products.map((product) => (
                  <div key={product.name} className="rounded-md border border-slate-200 bg-lightBg p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <p className="text-sm font-semibold text-primary">{product.name}</p>
                      <span className={`w-fit shrink-0 rounded-md px-2.5 py-1 text-xs font-bold ${getStatusClass(product.status)}`}>
                        {product.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{product.description}</p>
                    <a
                      href={product.href}
                      className="focus-ring mt-3 inline-flex min-h-9 items-center justify-center gap-2 rounded-md bg-accentTeal px-3 text-sm font-semibold text-white transition hover:bg-teal-800"
                    >
                      {product.action}
                      <ArrowRight size={16} aria-hidden="true" />
                    </a>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section id="problem" eyebrow="Problem" title="Still Doing This Every Week?">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {painCards.map(([label, Icon], index) => (
            <PainCard key={label} label={label} icon={Icon} index={index} />
          ))}
        </div>
      </Section>

      <Section id="solutions" eyebrow="Solutions" title="Automation built around real office work" className="bg-lightBg">
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
              AR-CERT-PRO turns certificate generation into a repeatable MVP workflow:
              Excel data to Word template to one generated DOCX stored in History.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                'Single DOCX generation',
                'Template-based',
                'Browser processing',
                'Stored History',
                'Local fallback download',
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
            {['Excel Data', 'Word Template', 'Selected Row', 'DOCX Output', 'History'].map((step, index) => (
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

      <Section id="workspace-readiness" eyebrow="Workspace readiness" title="Ready to use where connected, clear setup where scoped">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.article
            className="rounded-lg border border-emerald-200 bg-emerald-50 p-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            transition={{ duration: 0.45 }}
          >
            <BadgeCheck className="text-emerald-700" size={28} aria-hidden="true" />
            <h3 className="mt-5 text-xl font-semibold text-primary">AR-CERT-PRO is ready to use</h3>
            <p className="mt-3 leading-7 text-slate-700">
              The certificate workflow is connected to the live product workspace. Other catalog products provide a clear setup path when a dedicated workspace is not live yet.
            </p>
            <div className="mt-5">
              <ButtonLink href="/dashboard/products/ar-cert-pro/workspace">
                Open AR-CERT-PRO Workspace
              </ButtonLink>
            </div>
          </motion.article>

          <motion.article
            className="rounded-lg border border-teal-200 bg-teal-50 p-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            <ShieldCheck className="text-teal-700" size={28} aria-hidden="true" />
            <h3 className="mt-5 text-xl font-semibold text-primary">Email safety stays locked down</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {safetyStatements.map((statement) => (
                <div key={statement} className="flex items-start gap-3 rounded-md border border-teal-100 bg-white/80 p-3">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-teal-700" size={17} aria-hidden="true" />
                  <p className="text-sm font-semibold leading-6 text-slate-700">{statement}</p>
                </div>
              ))}
            </div>
          </motion.article>
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
                href={auditFormLink}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-primary transition hover:bg-slate-100"
              >
                Book Automation Audit <ArrowRight size={18} />
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
              Product-suite automation for Word templates, Excel data, DOCX outputs, and safe email preparation workflows.
            </p>
          </div>
          <div className="text-sm text-slate-500 lg:text-right">
            <p>Project Atlas public product suite</p>
            <p className="mt-2">Built for ready-to-use product review with honest feature status.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

export default LandingPage
