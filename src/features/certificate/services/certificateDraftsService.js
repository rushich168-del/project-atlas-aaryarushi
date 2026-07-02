import { supabase } from '../../../lib/supabaseClient.js'

export async function saveGenerationDraft({
  draftId,
  organizationId,
  productId,
  templateId,
  uploadId,
  fieldMapping,
  previewRowIndex,
  previewData,
  status,
  userId,
}) {
  if (!organizationId) {
    throw new Error('No organization is selected.')
  }

  if (!productId) {
    throw new Error('No product is selected.')
  }

  if (!templateId) {
    throw new Error('Upload a template before saving.')
  }

  if (!uploadId) {
    throw new Error('Upload an Excel file before saving.')
  }

  if (!userId) {
    throw new Error('No authenticated user is available.')
  }

  const payload = {
    organization_id: organizationId,
    product_id: productId,
    template_id: templateId,
    upload_id: uploadId,
    field_mapping: fieldMapping,
    preview_row_index: previewRowIndex,
    preview_data: previewData,
    status,
    created_by: userId,
  }

  if (draftId) {
    const { data, error } = await supabase
      .from('generation_drafts')
      .update(payload)
      .eq('id', draftId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  }

  const { data, error } = await supabase
    .from('generation_drafts')
    .insert(payload)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}
