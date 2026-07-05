import { ArrowUpRight, CalendarClock, CheckCircle2, FileInput, FileOutput, FileText, Layers3, Target } from 'lucide-react'
import DataStateBanner from '../components/dashboard/DataStateBanner.jsx'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import EnvironmentBanner from '../components/dashboard/EnvironmentBanner.jsx'
import ProductBadges from '../components/products/ProductBadges.jsx'
import { getCategoryById, getProductBySlug } from '../data/products.js'
import { useProductCatalog } from '../hooks/useProductCatalog.js'
import { navigateTo } from '../utils/routes.js'

const arCertProWorkflow = [
  'Upload Word certificate template',
  'Upload Excel student data',
  'Map fields',
  'Preview',
  'Generate DOCX',
  'Check History / Email Prep dry-run',
]

const arCertProReadiness = [
  'Template uploaded',
  'Excel uploaded',
  'Fields mapped',
  'Preview ready',
  'DOCX generation ready',
  'Batch generation ready',
  'Email dry-run ready',
]

const arCertProLabels = ['Ready to use', 'DOCX Output', 'Excel to Word', 'Safe Email Preparation']

const arWorksheetProWorkflow = [
  'Upload worksheet Word template',
  'Upload Excel worksheet/question/student data',
  'Map worksheet fields',
  'Preview one row',
  'Generate DOCX worksheets',
  'Review outputs in History',
]

const arWorksheetProReadiness = [
  'Product positioning ready',
  'Dashboard card ready',
  'Detail page ready',
  'DOCX output planned',
  'Workspace setup path ready',
  'PDF export not available',
  'Real email sending disabled',
]

const arWorksheetProLabels = ['Workspace setup', 'DOCX Output', 'Excel to Worksheets', 'Setup Workspace']

const arQuestionProWorkflow = [
  'Upload question paper Word template',
  'Upload Excel question/question-bank data',
  'Map question fields',
  'Preview one row or one generated set',
  'Generate DOCX question papers',
  'Review outputs in History',
]

const arQuestionProReadiness = [
  'Product positioning ready',
  'Dashboard card ready',
  'Detail page ready',
  'DOCX output planned',
  'Workspace setup path ready',
  'PDF export not available',
  'Question randomization not claimed',
  'Real email sending disabled',
]

const arQuestionProLabels = ['Workspace setup', 'DOCX Output', 'Excel to Questions', 'Setup Workspace']

const arFeeReceiptProWorkflow = [
  'Upload fee receipt Word template',
  'Upload Excel fee/student data',
  'Map receipt fields',
  'Preview one receipt',
  'Generate DOCX fee receipts',
  'Review outputs in History',
]

const arFeeReceiptProReadiness = [
  'Product workspace plan prepared',
  'Dashboard plan card ready',
  'Detail plan page ready',
  'DOCX generation workflow planned',
  'Dedicated fee receipt workspace requires setup',
  'PDF export not available',
  'Real email sending disabled',
]

const arFeeReceiptProPlaceholders = [
  'ReceiptNumber',
  'StudentName',
  'Class',
  'Course',
  'Amount',
  'ReceiptDate',
  'ReceiptMode',
  'AcademicYear',
  'BalanceAmount',
  'AuthorizedBy',
]

const arFeeReceiptProLabels = ['Request setup', 'Planned DOCX', 'Fee Receipts', 'Workspace Setup']

const arMailProWorkflow = [
  'Upload or select Excel/contact data',
  'Prepare an email subject and body template',
  'Map recipient and personalization fields',
  'Preview prepared recipients and message content',
  'Run server-authoritative dry-run validation',
  'Review prepared count and safety results',
]

const arMailProReadiness = [
  'Mail preparation positioning ready',
  'Email preparation workflow described',
  'Recipient preview and prepared count supported',
  'Server-authoritative dry-run validation supported',
  'No real row-recipient emails are sent',
  'Controlled batch sending remains disabled',
  'Failed-row resend remains disabled',
  'Gmail/Outlook OAuth not added',
]

const arMailProLabels = ['Mail preparation', 'Email Prep', 'Dry-run validation', 'Real sending disabled']

const arMarksheetProWorkflow = [
  'Upload marksheet Word template',
  'Upload Excel marks data',
  'Map student and subject fields',
  'Preview one row',
  'Generate DOCX marksheets',
  'Review outputs in History',
]

const arMarksheetProReadiness = [
  'Product positioning ready',
  'Dashboard card ready',
  'Detail page ready',
  'DOCX output planned',
  'Workspace setup path ready',
  'PDF export not available',
  'Real email sending disabled',
]

const arMarksheetProLabels = ['Workspace setup', 'DOCX Output', 'Excel to Marksheet', 'Setup Workspace']

const arInvoiceProWorkflow = [
  'Upload invoice Word template',
  'Upload Excel invoice/client data',
  'Map invoice fields',
  'Preview one invoice row',
  'Generate DOCX invoices',
  'Review outputs in History',
]

const arInvoiceProReadiness = [
  'Product positioning ready',
  'Dashboard card ready',
  'Detail page ready',
  'DOCX output planned',
  'Workspace setup path ready',
  'PDF export not available',
  'Real email sending disabled',
]

const arInvoiceProLabels = ['Workspace setup', 'DOCX Output', 'Excel to Invoice', 'Setup Workspace']

const arIdcardProWorkflow = [
  'Upload ID card Word template',
  'Upload Excel student/employee data',
  'Map name, ID, class/department, and photo-related fields if applicable',
  'Preview one row',
  'Generate DOCX ID cards',
  'Review outputs in History',
]

const arIdcardProReadiness = [
  'Product positioning ready',
  'Dashboard card ready',
  'Detail page ready',
  'DOCX output planned',
  'Workspace setup path ready',
  'Photo automation not fully live',
  'PDF export not available',
  'Real email sending disabled',
]

const arIdcardProLabels = ['Workspace setup', 'DOCX Output', 'Excel to ID Cards', 'Setup Workspace']

const arReportProWorkflow = [
  'Upload report Word template',
  'Upload Excel student/report data',
  'Map student, marks, attendance, remarks, and report fields',
  'Preview one row',
  'Generate DOCX reports',
  'Review outputs in History',
]

const arReportProReadiness = [
  'Product positioning ready',
  'Dashboard card ready',
  'Detail page ready',
  'DOCX output planned',
  'Workspace setup path ready',
  'PDF export not available',
  'Real email sending disabled',
]

const arReportProLabels = ['Workspace setup', 'DOCX Output', 'Excel to Reports', 'Setup Workspace']

export default function ProductDetailPage({ slug }) {
  const { organization, categories, products, source, status, loading, error } = useProductCatalog()
  const product = products.find((item) => item.slug === slug) || getProductBySlug(slug)

  if (loading) {
    return (
      <DashboardLayout title="Loading product" eyebrow="Project Atlas" showBack currentView="products" workspaceStatus={status}>
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <EnvironmentBanner />
          <DataStateBanner loading={loading} error={error} source={source} status={status} organization={organization} />
        </div>
      </DashboardLayout>
    )
  }

  if (!product) {
    return (
      <DashboardLayout title="Product not found" eyebrow="Project Atlas" showBack workspaceStatus={status}>
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <EnvironmentBanner />
          <DataStateBanner loading={loading} error={error} source={source} status={status} organization={organization} />
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-primary">This product is not available in the current workspace.</h2>
            <button
              type="button"
              onClick={() => navigateTo('/dashboard')}
              className="focus-ring mt-5 inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const category = categories.find((item) => item.id === product.categoryId) || getCategoryById(product.categoryId)
  const isArCertPro = product.slug === 'ar-cert-pro'
  const isArMarksheetPro = product.slug === 'ar-marksheet-pro'
  const isArInvoicePro = product.slug === 'ar-invoice-pro'
  const isArIdcardPro = product.slug === 'ar-idcard-pro'
  const isArReportPro = product.slug === 'ar-report-pro'
  const isArWorksheetPro = product.slug === 'ar-worksheet-pro'
  const isArQuestionPro = product.slug === 'ar-question-pro'
  const isArFeeReceiptPro = product.slug === 'ar-fee-receipt-pro'
  const isArMailPro = product.slug === 'ar-mail-pro'
  const hasDedicatedWorkspace = isArCertPro
  const mainActionLabel = hasDedicatedWorkspace
    ? 'Open Workspace'
    : isArMailPro
      ? 'Review Mail Prep Checklist'
      : 'Start Workspace Setup'
  const actionHelpText = hasDedicatedWorkspace
    ? 'Opens the connected AR-CERT-PRO workspace for template upload, data upload, preview, DOCX generation, and History.'
    : isArMailPro
      ? 'Use this page to prepare the mail workflow safely. Real row-recipient sending stays disabled.'
      : 'Use this setup page to confirm template, data, fields, and output expectations before a dedicated workspace is connected.'
  const beforeStartChecklist = isArMailPro
    ? [
      'Excel/contact data with recipient and personalization columns',
      'Subject and body template text',
      'Recipient field mapping',
      'Preview prepared recipients before any dry-run validation',
    ]
    : isArFeeReceiptPro
      ? [
        'Word fee receipt template',
        'Excel fee/student data',
        'Required placeholders such as ReceiptNumber, StudentName, Amount, ReceiptDate, and AuthorizedBy',
        'Preview one receipt layout before generation is enabled',
      ]
      : isArCertPro
        ? [
          'Word certificate template',
          'Excel student data',
          'Required placeholders such as StudentName, Course, Date, and CertificateId',
          'Preview one row before DOCX generation',
        ]
        : [
          `Word ${product.name.replace('AR-', '').replace('-PRO', '').toLowerCase()} template`,
          'Excel data file for the rows to prepare',
          'Required columns/placeholders for names, dates, IDs, subjects, amounts, or remarks as needed',
          'Preview one row before generation is enabled',
        ]
  const expectedOutputText = isArMailPro
    ? 'Prepared recipient preview, prepared count, and dry-run validation results. No real row-recipient emails are sent.'
    : hasDedicatedWorkspace
      ? 'Editable DOCX output, generated batch files, and History records from the connected workspace.'
      : 'A clear setup checklist for the product workflow. DOCX output is expected only after the dedicated workspace is connected and tested.'
  const handleMainAction = () => {
    if (hasDedicatedWorkspace) {
      navigateTo(`/dashboard/products/${product.slug}/workspace`)
      return
    }

    document.getElementById('before-you-start')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <DashboardLayout title={product.name} eyebrow={category?.name || 'Product'} showBack currentView="products" workspaceStatus={status}>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <EnvironmentBanner />
        <DataStateBanner loading={loading} error={error} source={source} status={status} organization={organization} />
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <ProductBadges product={product} />
              <h2 className="mt-5 text-3xl font-semibold text-primary">{product.name}</h2>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">{product.summary}</p>
              {isArCertPro ? (
                <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                  Built for schools, colleges, coaching centers, and training institutes that need repeatable certificate generation from familiar Excel and Word files.
                </p>
              ) : null}
              {isArMarksheetPro ? (
                <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                  Prepared for schools, colleges, coaching centers, training institutes, and admin offices that manage repeated student marksheet documents from spreadsheet data.
                </p>
              ) : null}
              {isArInvoicePro ? (
                <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                  Prepared for small businesses, independent service providers, coaching centers, admin offices, training institutes, and local teams that need repeatable invoice documents from spreadsheet data.
                </p>
              ) : null}
              {isArIdcardPro ? (
                <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                  Prepared for schools, colleges, coaching centers, training institutes, HR teams, admin offices, and small organizations that need repeatable ID card documents from spreadsheet data.
                </p>
              ) : null}
              {isArReportPro ? (
                <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                  Prepared for schools, colleges, coaching centers, training institutes, class teachers, academic coordinators, and admin offices that need repeatable progress reports from spreadsheet data.
                </p>
              ) : null}
              {isArWorksheetPro ? (
                <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                  Prepared for schools, colleges, coaching centers, training institutes, teachers, and academic coordinators that need repeatable classroom worksheets from spreadsheet data.
                </p>
              ) : null}
              {isArQuestionPro ? (
                <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                  Prepared for schools, colleges, coaching centers, training institutes, teachers, academic coordinators, and exam teams that need repeatable question documents from spreadsheet data.
                </p>
              ) : null}
              {isArFeeReceiptPro ? (
                <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                  Prepared as a product setup path for schools, colleges, coaching centers, training institutes, admin offices, and accounts teams that need fee receipt documents.
                </p>
              ) : null}
              {isArMailPro ? (
                <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                  Prepared for schools, colleges, coaching centers, training institutes, admin offices, small businesses, and HR/admin teams that need safe personalized email preparation from spreadsheet data.
                </p>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-2">
                {(isArCertPro ? arCertProLabels : isArMarksheetPro ? arMarksheetProLabels : isArInvoicePro ? arInvoiceProLabels : isArIdcardPro ? arIdcardProLabels : isArReportPro ? arReportProLabels : isArWorksheetPro ? arWorksheetProLabels : isArQuestionPro ? arQuestionProLabels : isArFeeReceiptPro ? arFeeReceiptProLabels : isArMailPro ? arMailProLabels : product.metrics).map((metric) => (
                  <span key={metric} className="inline-flex min-h-9 items-center rounded-md border border-slate-200 bg-lightBg px-3 text-sm font-semibold text-slate-600">
                    {metric}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
              <div className="rounded-md border border-slate-200 bg-lightBg p-4">
                <p className="text-sm font-semibold text-slate-500">Category</p>
                <p className="mt-1 text-lg font-semibold text-primary">{category?.name}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-lightBg p-4">
                <p className="text-sm font-semibold text-slate-500">Stage</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-primary">{product.stage}</p>
              </div>
              <div className="rounded-md border border-teal-200 bg-teal-50 p-4 sm:col-span-2">
                <p className="text-sm font-semibold text-teal-700">Next action</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{actionHelpText}</p>
                <button
                  type="button"
                  onClick={handleMainAction}
                  className="focus-ring mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-accentTeal px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
                >
                  {mainActionLabel}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Product code', product.productCode || product.name],
              ['Sector', product.sector || 'catalog'],
              ['Current version', product.currentVersion || '0.1'],
              ['Desktop availability', product.desktopAvailable ? 'Available' : 'Not available'],
              ['SaaS availability', product.saasAvailable ? 'Available' : 'Planned'],
              ['Beta status', product.isBeta ? 'Beta' : 'Stable'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-slate-200 bg-lightBg p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
                <p className="mt-1 text-sm font-semibold text-primary">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="before-you-start" className="mt-6 grid gap-4 xl:grid-cols-[1fr_1.1fr_1fr]">
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <FileText className="text-accentBlue" size={24} aria-hidden="true" />
            <h3 className="mt-5 text-lg font-semibold text-primary">What this product does</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{product.summary}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This page keeps the workflow simple: prepare the template, prepare the spreadsheet, map fields, preview one row, then continue only where the workspace capability is available.
            </p>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <CheckCircle2 className="text-accentTeal" size={24} aria-hidden="true" />
            <h3 className="mt-5 text-lg font-semibold text-primary">Before you start</h3>
            <div className="mt-4 grid gap-2">
              {beforeStartChecklist.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-md border border-slate-200 bg-lightBg p-3">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-accentTeal" aria-hidden="true" />
                  <p className="text-sm font-semibold leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <FileOutput className="text-accentBlue" size={24} aria-hidden="true" />
            <h3 className="mt-5 text-lg font-semibold text-primary">Expected output</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{expectedOutputText}</p>
            {!hasDedicatedWorkspace ? (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-semibold text-amber-800">Safe setup message</p>
                <p className="mt-1 text-sm leading-6 text-amber-800">
                  This product does not open a separate fake workspace. Use the setup checklist here until the dedicated workflow is connected and tested.
                </p>
              </div>
            ) : null}
          </article>
        </section>

        {isArCertPro ? (
          <section className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-primary">Product workspace workflow</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                AR-CERT-PRO turns a certificate template and student spreadsheet into individual DOCX certificates with a safe review path before any email work.
              </p>
              <div className="mt-4 grid gap-2">
                {arCertProWorkflow.map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accentTeal text-xs font-bold text-white">{index + 1}</span>
                    <p className="text-sm font-semibold text-primary">{step}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-primary">Workspace readiness checklist</h3>
              <div className="mt-4 grid gap-2">
                {arCertProReadiness.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-3">
                    <CheckCircle2 size={17} className="shrink-0 text-accentTeal" aria-hidden="true" />
                    <p className="text-sm font-semibold text-emerald-800">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-semibold text-amber-800">Current limitations</p>
                <p className="mt-1 text-sm leading-6 text-amber-800">PDF export is not available yet. Real email sending is disabled. Email Prep supports dry-run/readiness checks only.</p>
              </div>
            </article>
          </section>
        ) : null}

        {isArWorksheetPro ? (
          <section className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-primary">Workspace setup workflow</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                AR-WORKSHEET-PRO is positioned as an education product workspace. The current setup path documents the worksheet workflow while a dedicated worksheet workspace is scoped.
              </p>
              <div className="mt-4 grid gap-2">
                {arWorksheetProWorkflow.map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accentTeal text-xs font-bold text-white">{index + 1}</span>
                    <p className="text-sm font-semibold text-primary">{step}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-primary">Readiness and limitations</h3>
              <div className="mt-4 grid gap-2">
                {arWorksheetProReadiness.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 p-3">
                    <CheckCircle2 size={17} className="shrink-0 text-accentBlue" aria-hidden="true" />
                    <p className="text-sm font-semibold text-blue-800">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-semibold text-amber-800">Current honesty note</p>
                <p className="mt-1 text-sm leading-6 text-amber-800">AR-WORKSHEET-PRO does not yet have a separate live workspace. PDF export and real email sending are not available.</p>
              </div>
            </article>
          </section>
        ) : null}

        {isArQuestionPro ? (
          <section className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-primary">Workspace setup workflow</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                AR-QUESTION-PRO is positioned as an education product workspace. The current setup path documents the question paper workflow while a dedicated question workspace is scoped.
              </p>
              <div className="mt-4 grid gap-2">
                {arQuestionProWorkflow.map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accentTeal text-xs font-bold text-white">{index + 1}</span>
                    <p className="text-sm font-semibold text-primary">{step}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-primary">Readiness and limitations</h3>
              <div className="mt-4 grid gap-2">
                {arQuestionProReadiness.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 p-3">
                    <CheckCircle2 size={17} className="shrink-0 text-accentBlue" aria-hidden="true" />
                    <p className="text-sm font-semibold text-blue-800">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-semibold text-amber-800">Current honesty note</p>
                <p className="mt-1 text-sm leading-6 text-amber-800">AR-QUESTION-PRO does not yet have a separate live workspace. PDF export, question randomization, and real email sending are not available.</p>
              </div>
            </article>
          </section>
        ) : null}

        {isArFeeReceiptPro ? (
          <section className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-primary">Product workspace setup plan</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                AR-FEE-RECEIPT-PRO is a product setup path for fee receipt documents. The plan is documented here so the dedicated workspace and generation workflow can be scoped accurately before use.
              </p>
              <div className="mt-4 grid gap-2">
                {arFeeReceiptProWorkflow.map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accentTeal text-xs font-bold text-white">{index + 1}</span>
                    <p className="text-sm font-semibold text-primary">Planned: {step}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-primary">Preparation notes</h3>
              <div className="mt-4 grid gap-2">
                {arFeeReceiptProReadiness.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                    <CheckCircle2 size={17} className="shrink-0 text-amber-700" aria-hidden="true" />
                    <p className="text-sm font-semibold text-amber-800">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-primary">Suggested future placeholders</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{arFeeReceiptProPlaceholders.join(', ')}</p>
              </div>
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-semibold text-amber-800">Current honesty note</p>
                <p className="mt-1 text-sm leading-6 text-amber-800">AR-FEE-RECEIPT-PRO requires workspace setup before use. A dedicated workspace, DOCX generation workflow, PDF export, and real email sending are not available inside Project Atlas yet.</p>
              </div>
            </article>
          </section>
        ) : null}

        {isArMailPro ? (
          <section className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-primary">Mail preparation workflow</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                AR-MAIL-PRO prepares personalized email batches from Excel/contact data and templates. Inside Project Atlas, this is dry-run only: no real row-recipient emails are sent.
              </p>
              <div className="mt-4 grid gap-2">
                {arMailProWorkflow.map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accentTeal text-xs font-bold text-white">{index + 1}</span>
                    <p className="text-sm font-semibold text-primary">{step}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-primary">Safety and capability status</h3>
              <div className="mt-4 grid gap-2">
                {arMailProReadiness.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-md border border-teal-200 bg-teal-50 p-3">
                    <CheckCircle2 size={17} className="shrink-0 text-teal-700" aria-hidden="true" />
                    <p className="text-sm font-semibold text-teal-800">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-semibold text-amber-800">Dry-run only in Project Atlas</p>
                <p className="mt-1 text-sm leading-6 text-amber-800">No real row-recipient emails are sent. Controlled batch sending remains disabled. Failed-row resend remains disabled. Gmail/Outlook OAuth is not added.</p>
              </div>
            </article>
          </section>
        ) : null}

        {isArMarksheetPro ? (
          <section className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-primary">Workspace setup workflow</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                AR-MARKSHEET-PRO is positioned as an education product workspace. The current setup path documents the marksheet workflow while a dedicated marksheet workspace is scoped.
              </p>
              <div className="mt-4 grid gap-2">
                {arMarksheetProWorkflow.map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accentTeal text-xs font-bold text-white">{index + 1}</span>
                    <p className="text-sm font-semibold text-primary">{step}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-primary">Readiness and limitations</h3>
              <div className="mt-4 grid gap-2">
                {arMarksheetProReadiness.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 p-3">
                    <CheckCircle2 size={17} className="shrink-0 text-accentBlue" aria-hidden="true" />
                    <p className="text-sm font-semibold text-blue-800">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-semibold text-amber-800">Current honesty note</p>
                <p className="mt-1 text-sm leading-6 text-amber-800">AR-MARKSHEET-PRO does not yet have a separate live workspace. PDF export and real email sending are not available.</p>
              </div>
            </article>
          </section>
        ) : null}

        {isArInvoicePro ? (
          <section className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-primary">Workspace setup workflow</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                AR-INVOICE-PRO is positioned as an Office / Business product workspace. The current setup path documents the invoice workflow while a dedicated invoice workspace is scoped.
              </p>
              <div className="mt-4 grid gap-2">
                {arInvoiceProWorkflow.map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accentTeal text-xs font-bold text-white">{index + 1}</span>
                    <p className="text-sm font-semibold text-primary">{step}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-primary">Readiness and limitations</h3>
              <div className="mt-4 grid gap-2">
                {arInvoiceProReadiness.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 p-3">
                    <CheckCircle2 size={17} className="shrink-0 text-accentBlue" aria-hidden="true" />
                    <p className="text-sm font-semibold text-blue-800">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-semibold text-amber-800">Current honesty note</p>
                <p className="mt-1 text-sm leading-6 text-amber-800">AR-INVOICE-PRO does not yet have a separate live workspace. PDF export and real email sending are not available.</p>
              </div>
            </article>
          </section>
        ) : null}

        {isArIdcardPro ? (
          <section className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-primary">Workspace setup workflow</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                AR-IDCARD-PRO is positioned as an education and HR/Admin product workspace. The current setup path documents the ID card workflow while a dedicated ID card workspace is scoped.
              </p>
              <div className="mt-4 grid gap-2">
                {arIdcardProWorkflow.map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accentTeal text-xs font-bold text-white">{index + 1}</span>
                    <p className="text-sm font-semibold text-primary">{step}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-primary">Readiness and limitations</h3>
              <div className="mt-4 grid gap-2">
                {arIdcardProReadiness.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 p-3">
                    <CheckCircle2 size={17} className="shrink-0 text-accentBlue" aria-hidden="true" />
                    <p className="text-sm font-semibold text-blue-800">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-semibold text-amber-800">Current honesty note</p>
                <p className="mt-1 text-sm leading-6 text-amber-800">AR-IDCARD-PRO does not yet have a separate live workspace. Photo automation is not fully live, PDF export is not available, and real email sending is disabled.</p>
              </div>
            </article>
          </section>
        ) : null}

        {isArReportPro ? (
          <section className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-primary">Workspace setup workflow</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                AR-REPORT-PRO is positioned as an education product workspace. The current setup path documents the report workflow while a dedicated report workspace is scoped.
              </p>
              <div className="mt-4 grid gap-2">
                {arReportProWorkflow.map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accentTeal text-xs font-bold text-white">{index + 1}</span>
                    <p className="text-sm font-semibold text-primary">{step}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-primary">Readiness and limitations</h3>
              <div className="mt-4 grid gap-2">
                {arReportProReadiness.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 p-3">
                    <CheckCircle2 size={17} className="shrink-0 text-accentBlue" aria-hidden="true" />
                    <p className="text-sm font-semibold text-blue-800">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-semibold text-amber-800">Current honesty note</p>
                <p className="mt-1 text-sm leading-6 text-amber-800">AR-REPORT-PRO does not yet have a separate live workspace. PDF export and real email sending are not available.</p>
              </div>
            </article>
          </section>
        ) : null}

        <section className="mt-6 grid gap-4 xl:grid-cols-[1fr_1fr_0.8fr]">
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <FileInput className="text-accentBlue" size={24} aria-hidden="true" />
            <h3 className="mt-5 text-lg font-semibold text-primary">Inputs</h3>
            <div className="mt-4 grid gap-3">
              {product.inputs.map((input) => (
                <div key={input} className="flex items-center gap-3 rounded-md border border-slate-200 bg-lightBg p-3 text-sm font-semibold text-slate-600">
                  <CheckCircle2 size={17} className="text-accentTeal" aria-hidden="true" />
                  {input}
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <FileOutput className="text-accentBlue" size={24} aria-hidden="true" />
            <h3 className="mt-5 text-lg font-semibold text-primary">Outputs</h3>
            <div className="mt-4 grid gap-3">
              {product.outputs.map((output) => (
                <div key={output} className="flex items-center gap-3 rounded-md border border-slate-200 bg-lightBg p-3 text-sm font-semibold text-slate-600">
                  <CheckCircle2 size={17} className="text-accentTeal" aria-hidden="true" />
                  {output}
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <Target className="text-accentBlue" size={24} aria-hidden="true" />
            <h3 className="mt-5 text-lg font-semibold text-primary">Audience</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{product.audience}</p>
            {isArCertPro ? (
              <button
                type="button"
                onClick={() => navigateTo(`/dashboard/products/${product.slug}/workspace`)}
                className="focus-ring mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-accentTeal px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
              >
                Open Workspace
                <ArrowUpRight size={16} aria-hidden="true" />
              </button>
            ) : null}
          </article>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          {[
            ['Scope', 'Requirements, users, inputs, outputs, and delivery notes can be tracked here in a later release.', Layers3],
            ['Documentation', 'Product briefs, screenshots, templates, and setup notes can be attached later.', FileText],
            ['Roadmap', 'Milestones, owner notes, release readiness, and support status can be tracked here.', CalendarClock],
          ].map(([title, description, Icon]) => (
            <article key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <Icon className="text-accentBlue" size={24} aria-hidden="true" />
              <h3 className="mt-5 text-lg font-semibold text-primary">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-6">
          <h3 className="text-lg font-semibold text-primary">MVP catalog detail</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            This view reads the current catalog source. AR-CERT-PRO is the first workspace connected to upload, draft, generation, and History.
          </p>
        </section>
      </div>
    </DashboardLayout>
  )
}
