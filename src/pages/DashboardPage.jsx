import { useEffect, useMemo, useState } from 'react'
import { Activity, Boxes, CheckCircle2, Clock3, FileClock, FileText, Layers3, UploadCloud } from 'lucide-react'
import DataStateBanner from '../components/dashboard/DataStateBanner.jsx'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import EnvironmentBanner from '../components/dashboard/EnvironmentBanner.jsx'
import StatCard from '../components/dashboard/StatCard.jsx'
import SuiteProductCard from '../components/dashboard/SuiteProductCard.jsx'
import { useProductCatalog } from '../hooks/useProductCatalog.js'
import { getGeneratedDocumentsHistory, getGenerationJobsHistory } from '../services/generatedDocumentsService.js'
import { navigateTo } from '../utils/routes.js'

export default function DashboardPage() {
  const { organization, categories, products, source, status, loading, error } = useProductCatalog()
  const [hasRecentWork, setHasRecentWork] = useState(false)
  const [selectedSuite, setSelectedSuite] = useState('Education Suite')

  useEffect(() => {
    let active = true

    async function fetchRecentWork() {
      if (!organization?.id) {
        setHasRecentWork(false)
        return
      }

      try {
        const [documentsResult, jobsResult] = await Promise.all([
          getGeneratedDocumentsHistory(organization.id, 1),
          getGenerationJobsHistory(organization.id, 1),
        ])

        if (!active) {
          return
        }

        setHasRecentWork(
          (documentsResult.documents?.length || 0) + (jobsResult.jobs?.length || 0) > 0,
        )
      } catch {
        if (active) {
          setHasRecentWork(false)
        }
      }
    }

    fetchRecentWork()

    return () => {
      active = false
    }
  }, [organization?.id])
  const stats = useMemo(
    () => [
      { label: 'Total products', value: products.length, detail: 'Across education, HR, and office automation.', icon: Boxes },
      { label: 'Ready to demo', value: products.filter((product) => product.status === 'Ready' || product.status === 'Demo Ready' || product.status === 'Launch Prep').length, detail: 'Products marked ready for client conversations.', icon: CheckCircle2, tone: 'teal' },
      { label: 'In progress', value: products.filter((product) => product.status === 'In progress').length, detail: 'Products with defined direction but active polish pending.', icon: Clock3, tone: 'amber' },
      { label: 'Categories', value: categories.length, detail: 'Primary business segments for catalog planning.', icon: Activity },
    ],
    [categories.length, products],
  )

  const suiteProducts = [
    {
      label: 'AR-CERT-PRO',
      productCode: 'AR-CERT-PRO',
      summary: 'Generate personalized certificates from Excel and Word templates. DOCX output with safe Email Prep dry-run.',
      suiteLabel: 'Education / Certificates',
      status: 'Demo Ready',
      badge: 'Demo Ready',
      active: true,
      href: '/dashboard/products/ar-cert-pro/workspace',
      buttonLabel: 'Start Demo',
    },
    {
      label: 'AR-WORKSHEET-PRO',
      productCode: 'AR-WORKSHEET-PRO',
      summary: 'Generate classroom worksheets and practice documents from Excel data and Word templates. Launch-prep detail is ready; workspace is coming next.',
      suiteLabel: 'Education / Worksheets',
      status: 'Launch Prep',
      badge: 'Launch Prep',
      active: true,
      href: '/dashboard/products/ar-worksheet-pro',
      buttonLabel: 'View Details',
    },
    {
      label: 'AR-QUESTION-PRO',
      productCode: 'AR-QUESTION-PRO',
      summary: 'Generate question papers, question sheets, and practice sets from Excel data and Word templates. Launch-prep detail is ready; workspace is coming next.',
      suiteLabel: 'Education / Question Papers',
      status: 'Launch Prep',
      badge: 'Launch Prep',
      active: true,
      href: '/dashboard/products/ar-question-pro',
      buttonLabel: 'View Details',
    },
    {
      label: 'AR-REPORT-PRO',
      productCode: 'AR-REPORT-PRO',
      summary: 'Generate student reports and progress documents from Excel data and Word templates. Launch-prep detail is ready; workspace is coming next.',
      suiteLabel: 'Education / Reports',
      status: 'Launch Prep',
      badge: 'Launch Prep',
      active: true,
      href: '/dashboard/products/ar-report-pro',
      buttonLabel: 'View Details',
    },
    {
      label: 'AR-MARKSHEET-PRO',
      productCode: 'AR-MARKSHEET-PRO',
      summary: 'Generate structured marksheets from Excel data and Word templates. Launch-prep detail is ready; workspace is coming next.',
      suiteLabel: 'Education / Marksheets',
      status: 'Launch Prep',
      badge: 'Launch Prep',
      active: true,
      href: '/dashboard/products/ar-marksheet-pro',
      buttonLabel: 'View Details',
    },
    {
      label: 'AR-IDCARD-PRO',
      productCode: 'AR-IDCARD-PRO',
      summary: 'Generate student or employee ID cards from Excel data and Word templates. Launch-prep detail is ready; workspace is coming next.',
      suiteLabel: 'Education / HR / ID Cards',
      status: 'Launch Prep',
      badge: 'Launch Prep',
      active: true,
      href: '/dashboard/products/ar-idcard-pro',
      buttonLabel: 'View Details',
    },
    {
      label: 'Offer Letter Engine',
      productCode: 'AR-OFFER-PRO',
      summary: 'Offer letters generated from HR data and standard templates.',
      suiteLabel: 'HR Suite',
      status: 'Coming Soon',
      badge: 'Coming Soon',
      active: false,
    },
    {
      label: 'Payslip Engine',
      productCode: 'AR-PAYSLIP-PRO',
      summary: 'Payroll slips generated from employee and salary data.',
      suiteLabel: 'HR Suite',
      status: 'Coming Soon',
      badge: 'Coming Soon',
      active: false,
    },
    {
      label: 'Employee ID Engine',
      productCode: 'AR-EMP-ID-PRO',
      summary: 'Employee IDs created from staff details and photo mappings.',
      suiteLabel: 'HR Suite',
      status: 'Coming Soon',
      badge: 'Coming Soon',
      active: false,
    },
    {
      label: 'Experience Letter Engine',
      productCode: 'AR-EXPERIENCE-PRO',
      summary: 'Generate experience letters for employees with standard formatting.',
      suiteLabel: 'HR Suite',
      status: 'Coming Soon',
      badge: 'Coming Soon',
      active: false,
    },
    {
      label: 'HR Mail Engine',
      productCode: 'AR-HRMAIL-PRO',
      summary: 'Batch mail templates for HR communication and announcements.',
      suiteLabel: 'HR Suite',
      status: 'Coming Soon',
      badge: 'Coming Soon',
      active: false,
    },
    {
      label: 'AR-INVOICE-PRO',
      productCode: 'AR-INVOICE-PRO',
      summary: 'Generate professional invoices from Excel data and Word templates. Launch-prep detail is ready; workspace is coming next.',
      suiteLabel: 'Office / Business / Invoices',
      status: 'Launch Prep',
      badge: 'Launch Prep',
      active: true,
      href: '/dashboard/products/ar-invoice-pro',
      buttonLabel: 'View Details',
    },
    {
      label: 'Quotation Engine',
      productCode: 'AR-QUOTATION-PRO',
      summary: 'Quotation templates generated from estimate details.',
      suiteLabel: 'Office / Business Suite',
      status: 'Coming Soon',
      badge: 'Coming Soon',
      active: false,
    },
    {
      label: 'Purchase Order Engine',
      productCode: 'AR-PO-PRO',
      summary: 'Purchase order creation from buyer, vendor, and item data.',
      suiteLabel: 'Office / Business Suite',
      status: 'Coming Soon',
      badge: 'Coming Soon',
      active: false,
    },
    {
      label: 'Receipt Engine',
      productCode: 'AR-RECEIPT-PRO',
      summary: 'Receipt generation for payment records and client acknowledgements.',
      suiteLabel: 'Office / Business Suite',
      status: 'Coming Soon',
      badge: 'Coming Soon',
      active: false,
    },
    {
      label: 'Business Mail Engine',
      productCode: 'AR-BUSINESSMAIL-PRO',
      summary: 'Business communication templates and mail merge workflows.',
      suiteLabel: 'Office / Business Suite',
      status: 'Coming Soon',
      badge: 'Coming Soon',
      active: false,
    },
  ]
  const suiteSections = [
    {
      title: 'Education Suite',
      description: 'Certificates, worksheets, reports, marksheets, and student documents.',
      tone: 'education',
      products: suiteProducts.filter((card) => card.suiteLabel === 'Education Suite' || card.suiteLabel.startsWith('Education /')),
    },
    {
      title: 'HR Suite',
      description: 'Offer letters, payslips, employee IDs, experience letters, and HR mail.',
      tone: 'hr',
      products: suiteProducts.filter((card) => card.suiteLabel === 'HR Suite'),
    },
    {
      title: 'Office / Business Suite',
      description: 'Invoices, quotations, purchase orders, receipts, and business mail.',
      tone: 'business',
      products: suiteProducts.filter((card) => card.suiteLabel === 'Office / Business Suite' || card.suiteLabel.startsWith('Office / Business /')),
    },
  ]
  const selectedSuiteSection = suiteSections.find((section) => section.title === selectedSuite) || suiteSections[0]

  return (
    <DashboardLayout title="Product Dashboard" eyebrow="Project Atlas MVP" currentView="dashboard" workspaceStatus={status}>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <EnvironmentBanner />
        <DataStateBanner loading={loading} error={error} source={source} status={status} organization={organization} />
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-accentTeal">Welcome to Project Atlas</p>
              <h2 className="mt-2 text-3xl font-semibold text-primary">Choose an automation product and continue your latest generation workflow.</h2>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                This dashboard keeps your SaaS workflow clean and ready for demos. Continue AR-CERT-PRO, start a new generation, or review History from one place.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-accentBlue">
                  <Layers3 size={20} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Stable checkpoint</p>
                  <p className="mt-1 text-sm font-semibold text-primary">v2.24 demo ready</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-primary">
              <FileText size={19} aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Quick action</h3>
            <p className="mt-2 text-lg font-semibold text-primary">Open Certificate Engine</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Resume the AR-CERT-PRO workspace and continue the existing certificate generation workflow.</p>
            <button
              type="button"
              onClick={() => navigateTo('/dashboard/products/ar-cert-pro/workspace')}
              className="focus-ring mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-accentTeal px-3.5 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              Open AR-CERT-PRO
            </button>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-accentBlue">
              <FileClock size={19} aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Quick action</h3>
            <p className="mt-2 text-lg font-semibold text-primary">View Generation History</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">See previously generated DOCX files and re-download from History.</p>
            <button
              type="button"
              onClick={() => navigateTo('/dashboard/history')}
              className="focus-ring mt-4 inline-flex min-h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-primary transition hover:border-accentBlue hover:text-accentBlue"
            >
              Open History
            </button>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-50 text-accentTeal">
              <UploadCloud size={19} aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Quick action</h3>
            <p className="mt-2 text-lg font-semibold text-primary">Upload Template</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Start a new batch by uploading your certificate template file in AR-CERT-PRO.</p>
            <button
              type="button"
              onClick={() => navigateTo('/dashboard/products/ar-cert-pro/workspace')}
              className="focus-ring mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-accentTeal px-3.5 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              Upload Template
            </button>
          </div>
          {hasRecentWork ? (
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                <Clock3 size={19} aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Quick action</h3>
              <p className="mt-2 text-lg font-semibold text-primary">Continue Recent Work</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Resume your most recent Certificate Engine workflow from the workspace.</p>
              <button
                type="button"
                onClick={() => navigateTo('/dashboard/products/ar-cert-pro/workspace')}
                className="focus-ring mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-accentTeal px-3.5 text-sm font-semibold text-white transition hover:bg-teal-800"
              >
                Continue work
              </button>
            </div>
          ) : null}
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-3">
            {suiteSections.map((section) => {
            const toneClass = section.tone === 'education'
              ? 'border-blue-100 bg-blue-50/70 text-blue-800'
              : section.tone === 'hr'
                ? 'border-emerald-100 bg-emerald-50/70 text-emerald-800'
                : 'border-slate-200 bg-slate-50 text-slate-800'
            const selected = selectedSuite === section.title

            return (
              <button
                key={section.title}
                type="button"
                onClick={() => setSelectedSuite(section.title)}
                className={`focus-ring rounded-lg border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${toneClass} ${selected ? 'ring-2 ring-primary/10' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-bold">{section.title}</p>
                    <p className="mt-2 text-sm leading-5 text-slate-600">{section.description}</p>
                  </div>
                  <span className="shrink-0 rounded-md border border-white/70 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {section.products.length} products
                  </span>
                </div>
              </button>
            )
          })}
          </div>

          <div className="mt-5 border-t border-slate-200 pt-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Selected suite</p>
                <h3 className="mt-1 text-xl font-semibold text-primary">{selectedSuiteSection.title}</h3>
              </div>
              <p className="text-sm font-semibold text-slate-500">{selectedSuiteSection.products.length} products shown</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {selectedSuiteSection.products.map((card) => (
                <SuiteProductCard key={card.productCode} card={card} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}
