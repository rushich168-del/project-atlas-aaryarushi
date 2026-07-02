import {
  DownloadsStep,
  ExcelStep,
  GenerateStep,
  MappingStep,
  PreviewStep,
  TemplateStep,
} from './steps.jsx'
import { saveGenerationDraft } from './services/certificateDraftsService.js'
import { generateCertificateDocx } from './services/certificateGenerationService.js'
import { uploadGeneratedCertificateDocx } from './services/certificateOutputsService.js'
import { mergeRow, validateFieldMapping } from '../../core/atlas/index.js'
import { getStorageError } from '../../utils/errorMessages.js'

const requiredFieldIds = ['name', 'course', 'date', 'certificate_id']

function hasRequiredMappings(state) {
  return getValidationResult(state).valid
}

function previewDataFromState(state) {
  return getMergeResult(state).values
}

function getMergeResult(state) {
  return mergeRow({
    fieldDefinitions: certificateWorkspaceConfig.templateFields,
    fieldMapping: state.fieldMapping,
    row: state.previewRows[state.previewRowIndex] || {},
    options: {
      locale: 'en-IN',
      emptyValue: '',
      trimText: true,
    },
  })
}

function getValidationResult(state) {
  return validateFieldMapping({
    detectedPlaceholders: state.detectedPlaceholders,
    invalidPlaceholders: state.invalidPlaceholders,
    fieldDefinitions: certificateWorkspaceConfig.templateFields,
    detectedColumns: state.detectedColumns,
    fieldMapping: state.fieldMapping,
  })
}

export const certificateWorkspaceConfig = {
  id: 'certificate',
  productSlug: 'ar-cert-pro',
  eyebrow: 'AR-CERT-PRO SaaS Workspace',
  title: 'Certificate Workspace',
  description:
    'Generate one DOCX certificate at a time from a saved draft and the selected Excel preview row.',
  templateFields: [
    { id: 'name', label: 'Recipient name', placeholder: '{{name}}', required: true, type: 'text', defaultValue: '', sample: 'Aarya Rushi' },
    { id: 'course', label: 'Course name', placeholder: '{{course}}', required: true, type: 'text', defaultValue: '', sample: 'Office Automation Foundations' },
    { id: 'date', label: 'Completion date', placeholder: '{{date}}', required: true, type: 'date', format: 'dd MMM yyyy', defaultValue: '', sample: 'July 2, 2026' },
    { id: 'certificate_id', label: 'Certificate ID', placeholder: '{{certificate_id}}', required: true, type: 'text', defaultValue: '', sample: 'CERT-001' },
    { id: 'trainer', label: 'Trainer name', placeholder: '{{trainer}}', required: false, type: 'text', defaultValue: '', sample: 'Automation Labs' },
  ],
  mockRow: {
    Name: 'Aarya Rushi',
    Course: 'Office Automation Foundations',
    Date: 'July 2, 2026',
    'Certificate ID': 'CERT-001',
    Trainer: 'Automation Labs',
  },
  createInitialState() {
    return {
      templateFile: null,
      templateRecord: null,
      excelFile: null,
      uploadRecord: null,
      detectedColumns: [],
      detectedPlaceholders: [],
      invalidPlaceholders: [],
      placeholderKeys: [],
      placeholderDuplicateCounts: {},
      placeholderDetectionError: '',
      previewRows: [],
      previewRowIndex: 0,
      rowCount: 0,
      uploadingTemplate: false,
      uploadingExcel: false,
      templateUploadError: '',
      excelUploadError: '',
      fieldMapping: {
        name: '',
        course: '',
        date: '',
        certificate_id: '',
        trainer: '',
      },
      draftRecord: null,
      draftDirty: true,
      savingDraft: false,
      draftError: '',
      draftSavedAt: '',
      generating: false,
      generationError: '',
      generationProgress: 0,
      generationComplete: false,
      persistingOutput: false,
      outputError: '',
      generatedDocx: null,
      generatedDocumentRecord: null,
    }
  },
  canGenerate(state) {
    return Boolean(state.templateRecord && state.uploadRecord && hasRequiredMappings(state) && getMergeResult(state).valid && state.draftRecord && !state.draftDirty)
  },
  canSave(state) {
    return Boolean(state.templateRecord && state.uploadRecord && hasRequiredMappings(state) && getMergeResult(state).valid)
  },
  async saveWorkspace(state, workspace) {
    const productId = workspace.product?.organizationId ? workspace.product.id : null
    const previewData = previewDataFromState(state)
    const draftRecord = await saveGenerationDraft({
      draftId: state.draftRecord?.id,
      organizationId: workspace.organization?.id,
      productId,
      templateId: state.templateRecord?.id,
      uploadId: state.uploadRecord?.id,
      fieldMapping: state.fieldMapping,
      previewRowIndex: state.previewRowIndex,
      previewData,
      status: hasRequiredMappings(state) && getMergeResult(state).valid ? 'ready' : 'draft',
      userId: workspace.user?.id,
    })

    return {
      draftRecord,
      draftDirty: false,
      draftError: '',
    }
  },
  async generateDocument(state, workspace, tools = {}) {
    const mergeResult = getMergeResult(state)
    tools.updateState?.({ generationProgress: 35, persistingOutput: false })

    const result = await generateCertificateDocx({
      templateRecord: state.templateRecord,
      mergeResult,
    })

    if (!result.valid) {
      throw new Error(result.errors.map((item) => item.message).join(' ') || 'DOCX generation failed.')
    }

    if (state.generatedDocx?.downloadUrl) {
      URL.revokeObjectURL(state.generatedDocx.downloadUrl)
    }

    const localDocx = {
      blob: result.blob,
      fileName: result.fileName,
      mimeType: result.mimeType,
      downloadUrl: URL.createObjectURL(result.blob),
      warnings: result.warnings,
      generatedAt: new Date().toISOString(),
      stored: false,
    }

    tools.updateState?.({ generationProgress: 70, persistingOutput: true })

    try {
      const productId = workspace.product?.organizationId ? workspace.product.id : null
      const generatedDocumentRecord = await uploadGeneratedCertificateDocx({
        organizationId: workspace.organization?.id,
        productId,
        templateId: state.templateRecord?.id,
        uploadId: state.uploadRecord?.id,
        draftId: state.draftRecord?.id,
        previewRowIndex: state.previewRowIndex,
        mergeData: mergeResult.values,
        blob: result.blob,
        fileName: result.fileName,
        userId: workspace.user?.id,
      })

      return {
        persistingOutput: false,
        outputError: '',
        generatedDocx: {
          ...localDocx,
          stored: true,
        },
        generatedDocumentRecord,
      }
    } catch (error) {
      return {
        persistingOutput: false,
        outputError: getStorageError(error),
        generatedDocx: localDocx,
        generatedDocumentRecord: null,
      }
    }
  },
  getGenerationStatus(state) {
    if (state.generating && !state.generatedDocx) {
      return state.persistingOutput || state.generationProgress >= 70 ? 'Saving output' : 'Generating DOCX'
    }

    if (state.generatedDocumentRecord) {
      return 'Stored DOCX ready'
    }

    if (state.generatedDocx && state.outputError) {
      return 'Local fallback ready'
    }

    if (state.generatedDocx) {
      return 'DOCX ready'
    }

    return 'Ready'
  },
  getReadinessItems(state) {
    return [
      {
        id: 'template',
        label: 'Template selected',
        description: 'DOCX certificate template is uploaded to Supabase Storage.',
        complete: Boolean(state.templateRecord),
      },
      {
        id: 'excel',
        label: 'Excel selected',
        description: 'Excel participant sheet is uploaded and headers are detected.',
        complete: Boolean(state.uploadRecord),
      },
      {
        id: 'mapping',
        label: 'Mapping',
        description: 'Required template fields are mapped to detected Excel columns.',
        complete: hasRequiredMappings(state),
      },
      {
        id: 'preview',
        label: 'Preview',
        description: 'A real Excel preview row is selected for HTML preview.',
        complete: state.previewRows.length > 0 && hasRequiredMappings(state) && getMergeResult(state).valid,
      },
      {
        id: 'draft',
        label: 'Draft Saved',
        description: 'Current mapping and preview data are saved to a generation draft.',
        complete: Boolean(state.draftRecord) && !state.draftDirty,
      },
      {
        id: 'ready',
        label: 'Ready to Generate',
        description: 'A saved valid draft can generate one DOCX from the selected preview row.',
        complete: Boolean(state.draftRecord) && !state.draftDirty && hasRequiredMappings(state) && getMergeResult(state).valid,
      },
    ]
  },
  getPreviewData: previewDataFromState,
  getMergeResult,
  getValidationResult,
  getMissingRequiredFields(state) {
    return getValidationResult(state).missingMappings
  },
  steps: [
    {
      id: 'template',
      label: 'Template',
      component: TemplateStep,
      isComplete: (state) => Boolean(state.templateRecord),
    },
    {
      id: 'excel',
      label: 'Excel',
      component: ExcelStep,
      isComplete: (state) => Boolean(state.uploadRecord),
    },
    {
      id: 'mapping',
      label: 'Mapping',
      component: MappingStep,
      isComplete: hasRequiredMappings,
    },
    {
      id: 'preview',
      label: 'Preview',
      component: PreviewStep,
      isComplete: hasRequiredMappings,
    },
    {
      id: 'generate',
      label: 'Generate',
      component: GenerateStep,
      isComplete: (state) => state.generationComplete,
    },
    {
      id: 'downloads',
      label: 'Downloads',
      component: DownloadsStep,
      isComplete: (state) => state.generationComplete,
    },
  ],
}
