import { useMemo, useState } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2, FileSpreadsheet, FileText, Info, Layers3, UploadCloud, X } from 'lucide-react'
import DataStateBanner from '../components/dashboard/DataStateBanner.jsx'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import EnvironmentBanner from '../components/dashboard/EnvironmentBanner.jsx'
import RequestCustomSetupButton from '../components/leads/RequestCustomSetupButton.jsx'
import { getCategoryById } from '../data/products.js'
import { certificateWorkspaceConfig } from '../features/certificate/config.js'
import { sharedDocumentWorkspaceConfigs } from '../features/document-workspace/config.js'
import WorkspaceLayout from '../features/workspace-engine/WorkspaceLayout.jsx'
import { useProductCatalog } from '../hooks/useProductCatalog.js'
import { navigateTo } from '../utils/routes.js'

const workspaceConfigs = {
  'ar-cert-pro': certificateWorkspaceConfig,
  ...sharedDocumentWorkspaceConfigs,
}

const productGuidance = {
  'ar-marksheet-pro': {
    templateLabel: 'Marksheet template',
    excelLabel: 'Student marks Excel',
    template: 'Upload a marksheet Word template with placeholders for student details, subjects, marks, totals, and remarks.',
    excel: 'Prepare student marks Excel data with student identity columns and subject/score columns.',
    fields: ['StudentName', 'RollNumber', 'Class', 'Subject', 'Marks', 'Total', 'Grade', 'Remarks'],
    purpose: 'Prepare a marksheet workspace by checking the student marks data and the marksheet template structure before generation is connected.',
  },
  'ar-report-pro': {
    templateLabel: 'Report template',
    excelLabel: 'Student performance Excel',
    template: 'Upload a student report Word template with placeholders for progress, attendance, remarks, and academic details.',
    excel: 'Prepare student report Excel data with student details, marks, attendance, and teacher remarks.',
    fields: ['StudentName', 'Class', 'Attendance', 'Marks', 'Progress', 'TeacherRemarks', 'AcademicYear'],
    purpose: 'Prepare a report workspace by aligning student report data with the report template and preview expectations.',
  },
  'ar-worksheet-pro': {
    templateLabel: 'Worksheet template',
    excelLabel: 'Worksheet content Excel',
    template: 'Upload a worksheet Word template with placeholders for topic, instructions, questions, and answer areas.',
    excel: 'Prepare worksheet content data with topics, question text, difficulty, and class/subject details.',
    fields: ['Topic', 'Class', 'Subject', 'Question', 'Instruction', 'Difficulty', 'AnswerKey'],
    purpose: 'Prepare a worksheet workspace by checking classroom worksheet content and template placeholders.',
  },
  'ar-question-pro': {
    templateLabel: 'Question paper template',
    excelLabel: 'Question bank Excel',
    template: 'Upload a question paper Word template with placeholders for sections, questions, marks, and exam details.',
    excel: 'Prepare question data with question text, section, marks, difficulty, and answer/reference fields.',
    fields: ['QuestionText', 'Section', 'Marks', 'Difficulty', 'QuestionType', 'AnswerHint'],
    purpose: 'Prepare a question paper workspace by matching question data to the question paper template layout.',
  },
  'ar-idcard-pro': {
    templateLabel: 'ID card template',
    excelLabel: 'Student/staff details Excel',
    template: 'Upload an ID card Word template with text placeholders for identity, class, section, role, academic year, blood group, and contact details.',
    excel: 'Prepare student or staff details with matching text columns. For photo-based cards, keep the photo area manual in the template for now.',
    fields: ['FullName', 'IDNumber', 'Class', 'Section', 'Role', 'AcademicYear', 'BloodGroup', 'ContactNumber'],
    purpose: 'Prepare text-based ID card documents from template and Excel data. Automated per-person photo/image placement is not enabled yet.',
  },
  'ar-invoice-pro': {
    templateLabel: 'Invoice template',
    excelLabel: 'Customer/item Excel',
    template: 'Upload an invoice Word template with placeholders for client, invoice number, line items, amount, and dates.',
    excel: 'Prepare invoice data with client details, invoice rows, amounts, taxes if used, and invoice dates.',
    fields: ['InvoiceNumber', 'ClientName', 'InvoiceDate', 'Item', 'Quantity', 'Amount', 'Total'],
    purpose: 'Prepare an invoice workspace by checking spreadsheet columns and invoice template placeholders before generation is connected.',
  },
  'ar-fee-receipt-pro': {
    templateLabel: 'Fee receipt template',
    excelLabel: 'Fee/student Excel',
    template: 'Upload a fee receipt Word template with placeholders for receipt number, student, amount, date, and authorization.',
    excel: 'Prepare fee receipt data with student details, fee amount, receipt date, class/course, and authorized-by fields.',
    fields: ['ReceiptNumber', 'StudentName', 'Class', 'Course', 'Amount', 'ReceiptDate', 'ReceiptMode', 'AuthorizedBy'],
    purpose: 'Prepare a fee receipt workspace by confirming receipt data and template placeholders before the dedicated workflow is connected.',
  },
  'ar-mail-pro': {
    templateLabel: 'Mail content guidance',
    excelLabel: 'Recipient list/data file',
    template: 'Prepare subject and body text with personalization placeholders such as {{Name}} or {{Course}}. No real email sending is enabled here.',
    excel: 'Select a local recipient list/data file with recipient email and personalization columns.',
    fields: ['RecipientEmail', 'Name', 'SubjectData', 'PersonalMessage', 'AttachmentReference'],
    purpose: 'Prepare a mail workspace for dry-run validation only. Real row-recipient sending remains disabled.',
  },
}

const defaultGuidance = {
  templateLabel: 'Word template',
  excelLabel: 'Excel data',
  template: 'Upload a Word template with clear placeholders for the values that should come from Excel.',
  excel: 'Prepare Excel data with one row per output and clear column names.',
  fields: ['Name', 'Date', 'ReferenceNumber', 'Description', 'Remarks'],
  purpose: 'Prepare this product workspace by matching template placeholders to spreadsheet columns before any generation workflow is connected.',
}

const progressSteps = ['Product selected', 'Template ready', 'Excel ready', 'Fields checked', 'Preview', 'Generate / Setup']

const templateExtensions = ['.doc', '.docx', '.txt']
const dataExtensions = ['.xls', '.xlsx', '.csv']

function formatFileSize(size = 0) {
  if (!size) return '0 KB'
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function getExtension(fileName = '') {
  const dotIndex = fileName.lastIndexOf('.')
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : ''
}

function buildLocalFileState(file, allowedExtensions, label) {
  if (!file) return null

  const extension = getExtension(file.name)
  const valid = allowedExtensions.includes(extension)

  return {
    name: file.name,
    size: file.size,
    extension,
    status: valid ? 'Ready' : 'Unsupported type',
    error: valid ? '' : `${label} should use ${allowedExtensions.join(', ')}.`,
  }
}

function GuidanceUploadBox({ icon: Icon, title, description, fileState, accept, allowedExtensions, onChange, onClear, disabled = false }) {
  const hasError = Boolean(fileState?.error)
  const hasFile = Boolean(fileState?.name)

  return (
    <div className={`rounded-lg border border-dashed bg-white p-5 shadow-sm transition ${disabled ? 'border-slate-200 bg-slate-50' : hasError ? 'border-rose-300' : 'border-slate-300 hover:border-accentTeal hover:bg-teal-50/30'}`}>
      <div className="flex items-start gap-4">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${hasError ? 'bg-rose-50 text-rose-700' : hasFile ? 'bg-teal-50 text-accentTeal' : 'bg-blue-50 text-accentBlue'}`}>
          <Icon size={22} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-primary">{title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          <div className={`mt-3 rounded-md border px-3 py-2 text-sm ${hasError ? 'border-rose-200 bg-rose-50 text-rose-800' : hasFile ? 'border-teal-200 bg-teal-50 text-teal-800' : 'border-slate-200 bg-lightBg text-slate-600'}`}>
            {hasFile ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{fileState.name}</p>
                  <p className="mt-1 text-xs font-semibold">{formatFileSize(fileState.size)} / {fileState.status}</p>
                </div>
                <button
                  type="button"
                  onClick={onClear}
                  className="focus-ring inline-flex min-h-8 items-center justify-center gap-1 rounded-md border border-white/70 bg-white px-2.5 text-xs font-semibold text-primary transition hover:border-slate-300"
                >
                  <X size={14} aria-hidden="true" />
                  Clear
                </button>
              </div>
            ) : (
              <p className="font-semibold">No file selected yet. Choose a file to mark this setup item as ready.</p>
            )}
            {hasError ? (
              <p className="mt-2 flex items-start gap-2 text-xs font-semibold leading-5">
                <AlertCircle className="mt-0.5 shrink-0" size={14} aria-hidden="true" />
                {fileState.error}
              </p>
            ) : null}
          </div>
          {!disabled ? (
            <label className="focus-ring mt-4 inline-flex min-h-10 cursor-pointer items-center justify-center rounded-md bg-accentTeal px-4 text-sm font-semibold text-white transition hover:bg-teal-800">
              Choose file
              <input
                type="file"
                accept={accept}
                className="sr-only"
                onChange={(event) => onChange(buildLocalFileState(event.target.files?.[0], allowedExtensions, title))}
              />
            </label>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function GuidedWorkspaceStarter({ product, category, catalogState }) {
  const [templateFile, setTemplateFile] = useState(null)
  const [excelFile, setExcelFile] = useState(null)
  const guidance = productGuidance[product.slug] || defaultGuidance
  const isMailProduct = product.slug === 'ar-mail-pro'
  const templateReady = isMailProduct || (templateFile?.status === 'Ready')
  const excelReady = excelFile?.status === 'Ready'
  const completedSteps = useMemo(() => new Set([
    'Product selected',
    ...(templateReady ? ['Template ready'] : []),
    ...(excelReady ? ['Excel ready'] : []),
  ]), [excelReady, templateReady])
  const suiteLabel = product.categoryId === 'education'
    ? 'Education Suite'
    : product.categoryId === 'office-business'
      ? 'Office / Business Suite'
      : 'HR / Admin Suite'

  return (
    <DashboardLayout title={`${product.name} Workspace`} eyebrow={category?.name || suiteLabel} showBack currentView="products" workspaceStatus={catalogState.status}>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <EnvironmentBanner />
        <DataStateBanner {...catalogState} />

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
            <div>
              <p className="text-sm font-semibold text-accentTeal">{suiteLabel}</p>
              <h2 className="mt-2 text-3xl font-semibold text-primary">{product.name}</h2>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">{guidance.purpose}</p>
              <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <Info className="mt-0.5 shrink-0 text-amber-700" size={18} aria-hidden="true" />
                  <p className="text-sm font-semibold leading-6 text-amber-800">
                    {isMailProduct
                      ? 'This workspace prepares and validates mail data only. Real row-recipient sending, controlled batch sending, failed-row resend, and Gmail/Outlook OAuth are not enabled.'
                      : 'This guided starter does not generate documents yet for this product. It helps prepare the template, Excel data, and field checklist safely before a dedicated workflow is connected.'}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <RequestCustomSetupButton
                  product={product}
                  source="product-workspace"
                  variant="outline"
                  supportingText="Share your template and Excel format needs."
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-lightBg p-4">
              <p className="text-sm font-semibold text-primary">Workspace progress</p>
              <div className="mt-4 grid gap-2">
                {progressSteps.map((step, index) => {
                  const complete = completedSteps.has(step)
                  const guidanceOnly = step === 'Fields checked'
                  const locked = step === 'Preview' || step === 'Generate / Setup'
                  const current = !complete && !guidanceOnly && !locked && (
                    index === 1 && !templateReady
                    || index === 2 && templateReady && !excelReady
                  )

                  return (
                    <div key={step} className={`flex items-center gap-3 rounded-md border p-3 ${complete ? 'border-teal-200 bg-teal-50' : current ? 'border-blue-200 bg-blue-50' : guidanceOnly ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ${complete ? 'bg-accentTeal text-white' : current ? 'bg-accentBlue text-white' : guidanceOnly ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>
                        {complete ? <CheckCircle2 size={15} aria-hidden="true" /> : locked ? '-' : index + 1}
                      </span>
                      <div>
                        <p className={`text-sm font-semibold ${complete ? 'text-teal-800' : current ? 'text-blue-800' : guidanceOnly ? 'text-amber-800' : 'text-slate-500'}`}>{step}</p>
                        {guidanceOnly ? <p className="mt-0.5 text-xs font-semibold text-amber-700">Guidance only</p> : null}
                        {locked ? <p className="mt-0.5 text-xs font-semibold text-slate-500">Locked until supported</p> : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-2">
          {isMailProduct ? (
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-teal-50 text-accentTeal">
                  <FileText size={22} aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold text-primary">{guidance.templateLabel}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{guidance.template}</p>
                  <p className="mt-3 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800">
                    Message content is prepared in the mail workflow. This starter only selects recipient data locally.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <GuidanceUploadBox
              icon={FileText}
              title={guidance.templateLabel}
              description={guidance.template}
              fileState={templateFile}
              accept=".doc,.docx,.txt"
              allowedExtensions={templateExtensions}
              onChange={setTemplateFile}
              onClear={() => setTemplateFile(null)}
            />
          )}
          <GuidanceUploadBox
            icon={FileSpreadsheet}
            title={guidance.excelLabel}
            description={guidance.excel}
            fileState={excelFile}
            accept=".xls,.xlsx,.csv"
            allowedExtensions={dataExtensions}
            onChange={setExcelFile}
            onClear={() => setExcelFile(null)}
          />
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1fr_0.9fr]">
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <Layers3 className="text-accentBlue" size={24} aria-hidden="true" />
            <h3 className="mt-5 text-lg font-semibold text-primary">Field and placeholder guidance</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Keep placeholder names in the Word template aligned with Excel column names. Use consistent spelling and avoid extra spaces so mapping is straightforward when the product workflow is connected.
            </p>
            <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm font-semibold text-blue-800">Field matching guide</p>
              <p className="mt-1 text-sm leading-6 text-blue-800">
                Use <span className="font-mono">{'{{ColumnName}}'}</span> placeholders in your Word template. Excel columns should match the placeholder name. Example: <span className="font-mono">{'{{StudentName}}'}</span> matches the <span className="font-mono">StudentName</span> column, and <span className="font-mono">{'{{Maths}}'}</span> matches the <span className="font-mono">Maths</span> column.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {guidance.fields.map((field) => (
                <span key={field} className="rounded-md border border-slate-200 bg-lightBg px-3 py-2 text-sm font-semibold text-slate-700">
                  {field}
                </span>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <UploadCloud className="text-accentTeal" size={24} aria-hidden="true" />
            <h3 className="mt-5 text-lg font-semibold text-primary">Next action</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {templateReady && excelReady
                ? 'Required local file selections are ready for this session. Continue by reviewing the product detail page or preparing setup with these requirements.'
                : 'Select the required local files to clarify setup requirements. Files are not uploaded or permanently stored from this starter.'}
            </p>
            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={() => navigateTo(`/dashboard/products/${product.slug}`)}
                className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-accentTeal px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
              >
                {isMailProduct ? 'Review Mail Prep' : 'Prepare Workspace'}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setTemplateFile(null)
                  setExcelFile(null)
                }}
                className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-primary transition hover:border-accentBlue hover:text-accentBlue"
              >
                Clear local selections
              </button>
            </div>
          </article>
        </section>
      </div>
    </DashboardLayout>
  )
}

export default function ProductWorkspacePage({ slug }) {
  const catalogState = useProductCatalog()
  const product = catalogState.products.find((item) => item.slug === slug)
  const config = workspaceConfigs[slug]
  const category = catalogState.categories.find((item) => item.id === product?.categoryId) || getCategoryById(product?.categoryId)

  if (catalogState.loading) {
    return (
      <DashboardLayout title="Loading workspace" eyebrow="Project Atlas" showBack currentView="products" workspaceStatus={catalogState.status}>
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <EnvironmentBanner />
          <DataStateBanner {...catalogState} />
        </div>
      </DashboardLayout>
    )
  }

  if (!product) {
    return (
      <DashboardLayout title="Product not found" eyebrow="Project Atlas" showBack currentView="products" workspaceStatus={catalogState.status}>
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <EnvironmentBanner />
          <DataStateBanner {...catalogState} />
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-primary">This product workspace is not available.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">The requested product could not be found in the current catalog. Return to the dashboard to choose an available product.</p>
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

  if (!config) {
    return <GuidedWorkspaceStarter product={product} category={category} catalogState={catalogState} />
  }

  return <WorkspaceLayout key={product.slug} product={product} config={config} catalogState={catalogState} />
}
