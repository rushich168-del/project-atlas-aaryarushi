import { useEffect, useMemo, useRef, useState } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout.jsx'
import DataStateBanner from '../../components/dashboard/DataStateBanner.jsx'
import EnvironmentBanner from '../../components/dashboard/EnvironmentBanner.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import ReadinessChecklist from './ReadinessChecklist.jsx'
import StepRenderer from './StepRenderer.jsx'
import WorkspaceFooter from './WorkspaceFooter.jsx'
import WorkspaceHeader from './WorkspaceHeader.jsx'
import WorkspaceMiniHeader from './WorkspaceMiniHeader.jsx'
import WorkspaceStepper from './WorkspaceStepper.jsx'
import { useWorkspaceStatus } from './useWorkspaceStatus.js'
import { getFriendlyError } from '../../utils/errorMessages.js'
import {
  clearPersistedWorkspace,
  hasResumableWork,
  loadPersistedWorkspace,
  persistWorkspace,
  pickPersistableState,
} from './workspacePersistence.js'

function getCompletedSteps(config, state) {
  return config.steps.reduce((completed, step) => {
    completed[step.id] = step.isComplete ? step.isComplete(state) : false
    return completed
  }, {})
}

function buildInitialState(config, persisted) {
  const base = config.createInitialState()

  if (!persisted) {
    return base
  }

  // Rehydrate only the whitelisted subset; keep base defaults for everything else
  // (in-flight flags, generation output blobs) so a restore never resurrects a
  // stale/non-serializable output.
  return { ...base, ...pickPersistableState(persisted) }
}

export default function WorkspaceLayout({ product, config, catalogState }) {
  const { user } = useAuth()
  // Read the per-product snapshot once at mount. WorkspaceLayout is keyed by
  // product slug (see ProductWorkspacePage), so this runs fresh for each product.
  const persistedRef = useRef(loadPersistedWorkspace(product.slug))
  const [activeStep, setActiveStep] = useState(() => {
    const savedStep = persistedRef.current?.activeStep
    return Number.isInteger(savedStep) ? Math.max(0, Math.min(savedStep, config.steps.length - 1)) : 0
  })
  const [workspaceState, setWorkspaceState] = useState(() => buildInitialState(config, persistedRef.current))
  const [restoreNotice, setRestoreNotice] = useState(() => hasResumableWork(persistedRef.current))
  const stepCardRef = useRef(null)
  const didMountRef = useRef(false)
  const completedSteps = useMemo(() => getCompletedSteps(config, workspaceState), [config, workspaceState])
  const { readinessItems, readinessPercentage, canGenerate } = useWorkspaceStatus(config, workspaceState)
  const activeStepConfig = config.steps[activeStep]
  const canClearFiles = Boolean(
    workspaceState.templateFile
    || workspaceState.templateRecord
    || workspaceState.excelFile
    || workspaceState.uploadRecord
    || workspaceState.detectedColumns?.length
    || workspaceState.previewRows?.length
    || workspaceState.excelRows?.length
    || workspaceState.generatedDocx
    || workspaceState.generatedDocumentRecord
    || workspaceState.batchJob
    || workspaceState.batchOutputs?.length
  )

  function updateState(update) {
    setWorkspaceState((current) => ({
      ...current,
      ...(typeof update === 'function' ? update(current) : update),
    }))
  }

  // Layer 1 persistence: mirror the whitelisted workspace snapshot into per-tab
  // sessionStorage on every change, so navigating away and back (and the app-wide
  // scroll restoration) find the workspace exactly as the user left it.
  useEffect(() => {
    persistWorkspace(product.slug, workspaceState, activeStep)
  }, [product.slug, workspaceState, activeStep])

  // Smart step focus: smoothly bring the active step card into view when the user
  // changes steps — but never on the very first mount (that would fight the
  // browser / scroll restoration returning the user to their saved position).
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }

    const node = stepCardRef.current

    if (!node) {
      return
    }

    window.requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [activeStep])

  async function handleGenerate() {
    if (!canGenerate || workspaceState.generating) {
      return
    }

    if (config.generateDocument) {
      updateState({
        generating: true,
        generationComplete: false,
        generationError: '',
        outputError: '',
        persistingOutput: false,
        generatedDocx: null,
        generatedDocumentRecord: null,
        generationProgress: 20,
      })

      try {
        const generatedState = await config.generateDocument(workspaceState, workspace, { updateState })
        updateState({
          ...generatedState,
          generating: false,
          generationComplete: true,
          generationProgress: 100,
          generationError: '',
        })
      } catch (error) {
        updateState({
          generating: false,
          persistingOutput: false,
          generationComplete: false,
          generationProgress: 0,
          generationError: getFriendlyError(error, 'DOCX generation failed. Check the template placeholders and selected preview row, then try again.'),
        })
      }

      return
    }

    updateState({ generating: true, generationComplete: false, generationProgress: 20 })

    window.setTimeout(() => updateState({ generationProgress: 45 }), 450)
    window.setTimeout(() => updateState({ generationProgress: 75 }), 900)
    window.setTimeout(() => updateState({ generating: false, generationComplete: true, generationProgress: 100 }), 1350)
  }

  async function handleGenerateBatch() {
    if (!config.generateBatchDocument || workspaceState.batchGenerating) {
      return
    }

    updateState({
      batchGenerating: true,
      batchError: '',
      batchComplete: false,
      batchJob: null,
      batchOutputs: [],
      batchProgress: {
        active: true,
        currentRow: 0,
        completedCount: 0,
        successCount: 0,
        failureCount: 0,
        currentName: 'Preparing batch',
      },
    })

    try {
      const batchState = await config.generateBatchDocument(workspaceState, workspace, { updateState })
      updateState({
        ...batchState,
        batchGenerating: false,
      })
    } catch (error) {
      updateState({
        batchGenerating: false,
        batchProgress: {
          active: false,
          currentRow: 0,
          completedCount: 0,
          successCount: 0,
          failureCount: 0,
          currentName: '',
        },
        batchError: getFriendlyError(error, 'Batch DOCX generation failed. Check the workbook rows and try again.'),
      })
    }
  }

  async function handleSaveWorkspace() {
    if (!config.saveWorkspace || workspaceState.savingDraft) {
      return
    }

    updateState({ savingDraft: true, draftError: '' })

    try {
      const savedState = await config.saveWorkspace(workspaceState, workspace)
      updateState({
        ...savedState,
        savingDraft: false,
        draftSavedAt: new Date().toISOString(),
      })
    } catch (error) {
      updateState({ savingDraft: false, draftError: getFriendlyError(error, 'The workspace could not be saved. Check the selected template, Excel upload, and field mapping, then try again.') })
    }
  }

  function handleClearFiles() {
    const confirmed = window.confirm('Clear uploaded files and local workspace output? This will not delete History or stored files.')

    if (!confirmed) {
      return
    }

    if (workspaceState.generatedDocx?.downloadUrl) {
      URL.revokeObjectURL(workspaceState.generatedDocx.downloadUrl)
    }

    clearPersistedWorkspace(product.slug)
    setRestoreNotice(false)
    setWorkspaceState(config.createInitialState())
    setActiveStep(0)
  }

  const actions = {
    updateState,
    generate: handleGenerate,
    generateBatch: handleGenerateBatch,
    saveWorkspace: handleSaveWorkspace,
  }
  const workspace = {
    product,
    organization: catalogState.organization,
    user,
  }

  const completedReadiness = readinessItems.filter((item) => item.complete).length
  const nextMissing = readinessItems.find((item) => !item.complete) || null
  const draftSaved = Boolean(workspaceState.draftRecord) && !workspaceState.draftDirty
  const saveStatusLabel = workspaceState.savingDraft
    ? 'Saving…'
    : draftSaved
      ? (workspaceState.draftSavedAt ? `Saved ${new Date(workspaceState.draftSavedAt).toLocaleTimeString()}` : 'Draft saved')
      : 'Draft unsaved'
  const restoredTemplateName = workspaceState.templateRecord?.file_name || workspaceState.templateFile?.name || ''
  const restoredExcelName = workspaceState.uploadRecord?.file_name || workspaceState.excelFile?.name || ''

  return (
    <DashboardLayout title={`${product.name} Workspace`} eyebrow={config.eyebrow} showBack currentView="products" workspaceStatus={catalogState.status}>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <EnvironmentBanner />
        <DataStateBanner
          loading={catalogState.loading}
          error={catalogState.error}
          source={catalogState.source}
          status={catalogState.status}
          organization={catalogState.organization}
        />

        <WorkspaceHeader
          product={product}
          config={config}
          activeStep={activeStep}
          readinessPercentage={readinessPercentage}
          statusLabel={workspaceState.draftRecord && !workspaceState.draftDirty ? 'Draft saved' : 'Draft unsaved'}
          totalSteps={config.steps.length}
        />

        <div className="mt-5">
          <WorkspaceStepper
            steps={config.steps}
            activeStep={activeStep}
            completedSteps={completedSteps}
            onStepChange={setActiveStep}
            canClear={canClearFiles}
            onClear={handleClearFiles}
          />
        </div>

        <WorkspaceMiniHeader
          productLabel={product.productCode || product.name}
          stepLabel={activeStepConfig?.label || ''}
          stepIndex={activeStep}
          totalSteps={config.steps.length}
          readinessDone={completedReadiness}
          readinessTotal={readinessItems.length}
          saveStatusLabel={saveStatusLabel}
          saved={draftSaved}
        />

        {restoreNotice ? (
          <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-blue-900">Workspace restored</p>
                <p className="mt-1 text-sm leading-6 text-blue-800">
                  Your previous mapping, preview row, and file selections were restored for this product.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {restoredTemplateName ? (
                    <span className="max-w-full break-words rounded-md border border-blue-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-800">
                      Template restored: {restoredTemplateName}
                    </span>
                  ) : null}
                  {restoredExcelName ? (
                    <span className="max-w-full break-words rounded-md border border-blue-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-800">
                      Excel restored: {restoredExcelName}
                    </span>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRestoreNotice(false)}
                className="focus-ring inline-flex min-h-9 shrink-0 items-center justify-center rounded-md border border-blue-200 bg-white px-3 text-xs font-semibold text-blue-800 transition hover:bg-blue-100"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div ref={stepCardRef} className="min-w-0 scroll-mt-24">
            <StepRenderer step={activeStepConfig} state={workspaceState} actions={actions} config={config} workspace={workspace} />
          </div>
          <div className="min-w-0 xl:max-w-[320px]">
            <ReadinessChecklist items={readinessItems} nextMissing={nextMissing} completedCount={completedReadiness} />
          </div>
        </div>

        <WorkspaceFooter
          activeStep={activeStep}
          totalSteps={config.steps.length}
          canSave={Boolean(config.canSave ? config.canSave(workspaceState) : canGenerate)}
          saving={workspaceState.savingDraft}
          saveLabel="Save Workspace"
          onBack={() => setActiveStep((step) => Math.max(step - 1, 0))}
          onNext={() => setActiveStep((step) => Math.min(step + 1, config.steps.length - 1))}
          onSave={handleSaveWorkspace}
        />
      </div>
    </DashboardLayout>
  )
}
