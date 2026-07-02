import DataStateBanner from '../components/dashboard/DataStateBanner.jsx'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import EnvironmentBanner from '../components/dashboard/EnvironmentBanner.jsx'
import { certificateWorkspaceConfig } from '../features/certificate/config.js'
import WorkspaceLayout from '../features/workspace-engine/WorkspaceLayout.jsx'
import { useProductCatalog } from '../hooks/useProductCatalog.js'
import { navigateTo } from '../utils/routes.js'

const workspaceConfigs = {
  'ar-cert-pro': certificateWorkspaceConfig,
}

export default function ProductWorkspacePage({ slug }) {
  const catalogState = useProductCatalog()
  const product = catalogState.products.find((item) => item.slug === slug)
  const config = workspaceConfigs[slug]

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

  if (!product || !config) {
    return (
      <DashboardLayout title="Workspace unavailable" eyebrow="Project Atlas" showBack currentView="products" workspaceStatus={catalogState.status}>
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <EnvironmentBanner />
          <DataStateBanner {...catalogState} />
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-primary">This product workspace is not configured yet.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">AR-CERT-PRO is the first product wired into the generic workspace engine.</p>
            <button
              type="button"
              onClick={() => navigateTo(`/dashboard/products/${slug}`)}
              className="focus-ring mt-5 inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Back to product
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return <WorkspaceLayout product={product} config={config} catalogState={catalogState} />
}
