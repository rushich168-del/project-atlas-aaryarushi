// Project Atlas v4.0 — Starter Template Guidance (frontend-only, display copy).
//
// First-use example guidance for the top products: what Word template to upload,
// which Excel columns to prepare, and the example {{Placeholder}} → column pairing.
// This is presentational guidance ONLY — it does not feed the DOCX generation
// engine, the field-mapping validator, or any payload.
//
// SOURCE OF TRUTH: the placeholder lists below are copied verbatim from the
// existing Sample Starter Pack (src/features/document-workspace/sampleStarters.js),
// which is aligned to each product's engine templateFields
// (src/features/certificate/config.js and src/features/document-workspace/config.js).
// The Excel column examples are DERIVED from those placeholders (inner text), so a
// guide can never drift from the placeholder it sits beside. Keep these in sync
// with sampleStarters.js if the starter pack ever changes.

function columnsFromPlaceholders(placeholders) {
  return placeholders.map((placeholder) => placeholder.replace(/^\{\{\s*/, '').replace(/\s*\}\}$/, ''))
}

const rawGuidance = {
  'ar-cert-pro': {
    productName: 'AR-CERT-PRO',
    templateHint: 'Upload a Word certificate template (.docx) with placeholders for the recipient name, course, date, certificate id, and trainer.',
    placeholders: ['{{name}}', '{{course}}', '{{date}}', '{{certificate_id}}', '{{trainer}}'],
    exampleField: 'name',
    output: 'One certificate DOCX per Excel row, ready to generate in bulk.',
  },
  'ar-marksheet-pro': {
    productName: 'AR-MARKSHEET-PRO',
    templateHint: 'Upload a Word marksheet template (.docx) with placeholders for the student, roll number, subject marks, total, and grade.',
    placeholders: ['{{StudentName}}', '{{RollNo}}', '{{Maths}}', '{{Physics}}', '{{Chemistry}}', '{{Total}}', '{{Grade}}'],
    exampleField: 'StudentName',
    output: 'One marksheet DOCX per Excel row, ready to generate in bulk.',
  },
  'ar-invoice-pro': {
    productName: 'AR-INVOICE-PRO',
    templateHint: 'Upload a Word invoice template (.docx) with placeholders for the invoice, customer, item, and amounts.',
    placeholders: ['{{InvoiceNo}}', '{{InvoiceDate}}', '{{CustomerName}}', '{{CustomerAddress}}', '{{ItemName}}', '{{Quantity}}', '{{Rate}}', '{{Amount}}', '{{TotalAmount}}'],
    exampleField: 'CustomerName',
    output: 'One invoice DOCX per Excel row, ready to generate in bulk.',
  },
  'ar-fee-receipt-pro': {
    productName: 'AR-FEE-RECEIPT-PRO',
    templateHint: 'Upload a Word fee receipt template (.docx) with placeholders for the receipt, student, fee type, amount paid, and balance.',
    placeholders: ['{{ReceiptNo}}', '{{ReceiptDate}}', '{{StudentName}}', '{{RollNo}}', '{{Class}}', '{{FeeType}}', '{{AmountPaid}}', '{{PaymentMode}}', '{{Balance}}'],
    exampleField: 'StudentName',
    output: 'One fee receipt DOCX per Excel row, ready to generate in bulk.',
  },
  'ar-question-pro': {
    productName: 'AR-QUESTION-PRO',
    templateHint: 'Upload a Word question paper template (.docx) with placeholders for the exam, class, subject, chapter, question, and marks.',
    placeholders: ['{{ExamName}}', '{{Class}}', '{{Subject}}', '{{Chapter}}', '{{QuestionNo}}', '{{QuestionText}}', '{{Marks}}', '{{TimeAllowed}}'],
    exampleField: 'QuestionNo',
    output: 'One question paper DOCX per Excel row, ready to generate in bulk.',
  },
}

// The rule and common-mistakes copy are shared across all products.
export const PLACEHOLDER_MATCH_RULE = 'Each Word placeholder must match an Excel column name exactly.'
export const COMMON_MISTAKES = [
  'Do not use spaces inside placeholders.',
  'Do not rename Excel columns after mapping.',
  'Use {{ColumnName}} format only.',
  'Make sure every required placeholder has a matching Excel column.',
]

export function getStarterTemplateGuidance(slug) {
  const guidance = rawGuidance[slug]
  if (!guidance) {
    return null
  }

  const columns = columnsFromPlaceholders(guidance.placeholders)
  // Use a real field for this product so the example never references a field the
  // product does not actually have.
  const field = guidance.exampleField
  const example = `If your Word template has {{${field}}}, your Excel file needs a ${field} column.`

  return { ...guidance, columns, example }
}
