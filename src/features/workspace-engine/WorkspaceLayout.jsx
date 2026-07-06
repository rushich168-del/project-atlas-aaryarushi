import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, FileSpreadsheet, FileText } from 'lucide-react'
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
import BuilderModeToggle from '../document-workspace/builder/BuilderModeToggle.jsx'
import BuilderWorkspace from '../document-workspace/builder/BuilderWorkspace.jsx'
import { uploadAndApplyExcel } from '../document-workspace/excelUploadHandler.js'
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
  // Builder-first products (worksheet / question paper) open in Build mode and
  // show the teacher builder as the primary content — the classic 6-step upload
  // flow lives behind the "Upload files" mode. Mode is persisted (builderMode) so
  // an old stale activeStep can never force the upload stepper on top.
  const builderFirst = Boolean(config.builder && config.builderModeEnabled)
  const builderMode = builderFirst ? (workspaceState.builderMode || config.builder.defaultMode || 'build') : null
  const showBuilder = builderFirst && builderMode === 'build'
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

  const builderModes = [
    { id: 'build', label: 'Build automatically' },
    { id: 'upload', label: 'Upload files' },
  ]

  function handleBuilderModeChange(mode) {
    updateState({ builderMode: mode })
  }

  // Feed builder-generated rows into the EXISTING Excel pipeline, then hand off to
  // the classic upload flow: switch to Upload mode and jump to the step that still
  // needs input (the Word template if not yet uploaded, otherwise field mapping).
  async function handleUseInWorkspace(file) {
    const outcome = await uploadAndApplyExcel({ file, config, workspace, actions })
    if (!outcome.ok) {
      return outcome
    }
    updateState({ builderMode: 'upload' })
    setRestoreNotice(false)
    const handoffStepId = workspaceState.templateRecord ? 'mapping' : 'template'
    const handoffIndex = config.steps.findIndex((step) => step.id === handoffStepId)
    setActiveStep(handoffIndex >= 0 ? handoffIndex : 0)
    return outcome
  }

  const completedReadiness = readinessItems.filter((item) => item.complete).length
  const nextMissing = readinessItems.find((item) => !item.complete) || null
  // Smart next-action: map the first incomplete readiness item to the step that
  // resolves it, then let the readiness panel jump straight there. Navigation
  // only — no generation logic is duplicated here.
  const readinessToStep = { template: 'template', excel: 'excel', mapping: 'mapping', preview: 'preview', draft: 'generate', ready: 'generate' }
  const nextActionStepId = nextMissing ? (readinessToStep[nextMissing.id] || 'generate') : 'generate'
  const nextActionStepIndex = Math.max(0, config.steps.findIndex((step) => step.id === nextActionStepId))
  // Use the target step's visible label so the button reads in the product's own
  // language (e.g. "Preview worksheet" / "Generate question paper DOCX" for the
  // builder products, "Preview Row" / "Generate DOCX" for data-to-template ones).
  const nextActionLabel = config.steps[nextActionStepIndex]?.label || 'Continue'
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
      <div className="px-4 py-5 sm:px-6 lg:px-8">
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

        {builderFirst ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary">How do you want to build this?</p>
              <p className="text-xs text-slate-500">
                {showBuilder
                  ? `Set the details and pattern — the ${config.builder?.builderType === 'question-paper' ? 'question paper' : 'worksheet'} is built for you. Advanced users can upload their own files.`
                  : 'Upload your own Word template and Excel content, or switch back to automatic build.'}
              </p>
            </div>
            <BuilderModeToggle mode={builderMode} modes={builderModes} onChange={handleBuilderModeChange} />
          </div>
        ) : null}

        {showBuilder ? (
          <div className="mt-4">
            <BuilderWorkspace
              config={config}
              state={workspaceState}
              actions={actions}
              onUseInWorkspace={handleUseInWorkspace}
            />
          </div>
        ) : (
        <>
        {builderFirst ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-teal-900">
                {workspaceState.builderConfig
                  ? 'Generated content is ready. Upload or choose a Word layout to create the final DOCX.'
                  : 'Upload a Word template and your Excel content to create the DOCX.'}
              </p>
              <p className="text-xs text-teal-700">Your generated {config.builder?.builderType === 'question-paper' ? 'question paper' : 'worksheet'} rows are preserved — return to the builder any time.</p>
            </div>
            <button
              type="button"
              onClick={() => handleBuilderModeChange('build')}
              className="focus-ring inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md border border-teal-300 bg-white px-3 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              Back to Builder
            </button>
          </div>
        ) : null}

        <div className="mt-3">
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
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
            <span className="text-sm font-semibold text-blue-900">Workspace restored</span>
            {restoredTemplateName ? (
              <span className="inline-flex max-w-full items-center gap-1 break-words rounded-md border border-blue-200 bg-white px-2 py-0.5 text-xs font-semibold text-blue-800">
                <FileText size={12} aria-hidden="true" /> {restoredTemplateName}
              </span>
            ) : null}
            {restoredExcelName ? (
              <span className="inline-flex max-w-full items-center gap-1 break-words rounded-md border border-blue-200 bg-white px-2 py-0.5 text-xs font-semibold text-blue-800">
                <FileSpreadsheet size={12} aria-hidden="true" /> {restoredExcelName}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setRestoreNotice(false)}
              className="focus-ring ml-auto inline-flex min-h-8 shrink-0 items-center justify-center rounded-md border border-blue-200 bg-white px-2.5 text-xs font-semibold text-blue-800 transition hover:bg-blue-100"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div ref={stepCardRef} className="min-w-0 scroll-mt-24">
            <StepRenderer step={activeStepConfig} state={workspaceState} actions={actions} config={config} workspace={workspace} />
          </div>
          <div className="min-w-0 xl:max-w-[320px]">
            <ReadinessChecklist
              items={readinessItems}
              nextMissing={nextMissing}
              completedCount={completedReadiness}
              nextActionLabel={nextActionLabel}
              onNextAction={() => setActiveStep(nextActionStepIndex)}
            />
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
        </>
        )}
      </div>
    </DashboardLayout>
  )
}
