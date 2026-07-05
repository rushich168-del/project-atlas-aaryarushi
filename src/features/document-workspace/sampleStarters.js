// Sample starter packs for the active DOCX workspace products.
//
// Each entry documents the exact starter structure a user needs:
//   - `placeholders`: the Word template tags, ALWAYS in {{ColumnName}} format.
//   - `columns`: the Excel headers. Kept identical to the placeholder inner text
//     so the sample template, the sample Excel, and the field mapping line up 1:1
//     and generate a filled DOCX with the current engine.
//   - `rows`: 2-3 realistic example rows keyed by column name.
//
// No photo/image columns are used anywhere (AR-IDCARD-PRO stays text-only).

function columnsFromPlaceholders(placeholders) {
  return placeholders.map((placeholder) => placeholder.replace(/^\{\{\s*/, '').replace(/\s*\}\}$/, ''))
}

const rawSampleStarters = {
  'ar-cert-pro': {
    productName: 'AR-CERT-PRO',
    templateLabel: 'Certificate template',
    excelLabel: 'Participant Excel',
    outputLabel: 'Certificates',
    placeholders: ['{{name}}', '{{course}}', '{{date}}', '{{certificate_id}}', '{{trainer}}'],
    rows: [
      { name: 'Aarya Rushi', course: 'Office Automation Foundations', date: 'July 2, 2026', certificate_id: 'CERT-001', trainer: 'Automation Labs' },
      { name: 'Meera Nair', course: 'Excel Reporting Essentials', date: 'July 2, 2026', certificate_id: 'CERT-002', trainer: 'Automation Labs' },
      { name: 'Rohan Patel', course: 'Document Automation Basics', date: 'July 2, 2026', certificate_id: 'CERT-003', trainer: 'Automation Labs' },
    ],
  },
  'ar-marksheet-pro': {
    productName: 'AR-MARKSHEET-PRO',
    templateLabel: 'Marksheet template',
    excelLabel: 'Student marks Excel',
    outputLabel: 'Marksheets',
    placeholders: ['{{StudentName}}', '{{RollNo}}', '{{Maths}}', '{{Physics}}', '{{Chemistry}}', '{{Total}}', '{{Grade}}'],
    rows: [
      { StudentName: 'Aarya Rushi', RollNo: 'ROLL-001', Maths: '92', Physics: '88', Chemistry: '90', Total: '270', Grade: 'A+' },
      { StudentName: 'Meera Nair', RollNo: 'ROLL-002', Maths: '78', Physics: '81', Chemistry: '76', Total: '235', Grade: 'A' },
      { StudentName: 'Rohan Patel', RollNo: 'ROLL-003', Maths: '65', Physics: '70', Chemistry: '68', Total: '203', Grade: 'B+' },
    ],
  },
  'ar-report-pro': {
    productName: 'AR-REPORT-PRO',
    templateLabel: 'Student report template',
    excelLabel: 'Student performance Excel',
    outputLabel: 'Reports',
    placeholders: ['{{StudentName}}', '{{RollNo}}', '{{Class}}', '{{Section}}', '{{Attendance}}', '{{Performance}}', '{{TeacherRemarks}}', '{{Result}}'],
    rows: [
      { StudentName: 'Aarya Rushi', RollNo: 'ROLL-001', Class: 'Class 9', Section: 'A', Attendance: '92%', Performance: 'Strong progress', TeacherRemarks: 'Keep practicing', Result: 'Pass' },
      { StudentName: 'Meera Nair', RollNo: 'ROLL-002', Class: 'Class 9', Section: 'A', Attendance: '88%', Performance: 'Steady improvement', TeacherRemarks: 'Focus on revision', Result: 'Pass' },
    ],
  },
  'ar-worksheet-pro': {
    productName: 'AR-WORKSHEET-PRO',
    templateLabel: 'Worksheet template',
    excelLabel: 'Worksheet content Excel',
    outputLabel: 'Worksheets',
    placeholders: ['{{WorksheetTitle}}', '{{Class}}', '{{Subject}}', '{{Topic}}', '{{Question1}}', '{{Question2}}', '{{Question3}}', '{{Instructions}}'],
    rows: [
      { WorksheetTitle: 'Fractions Practice', Class: 'Class 6', Subject: 'Mathematics', Topic: 'Fractions', Question1: 'Solve 1/2 + 1/4', Question2: 'Convert 3/4 to decimal', Question3: 'Compare 2/3 and 3/5', Instructions: 'Answer all questions' },
      { WorksheetTitle: 'Photosynthesis Basics', Class: 'Class 7', Subject: 'Science', Topic: 'Photosynthesis', Question1: 'Name the pigment used', Question2: 'Write the word equation', Question3: 'State one product', Instructions: 'Answer in full sentences' },
    ],
  },
  'ar-question-pro': {
    productName: 'AR-QUESTION-PRO',
    templateLabel: 'Question paper template',
    excelLabel: 'Question bank Excel',
    outputLabel: 'Question papers',
    placeholders: ['{{ExamName}}', '{{Class}}', '{{Subject}}', '{{Chapter}}', '{{QuestionNo}}', '{{QuestionText}}', '{{Marks}}', '{{TimeAllowed}}'],
    rows: [
      { ExamName: 'Science Practice Test', Class: 'Class 8', Subject: 'Science', Chapter: 'Light', QuestionNo: 'Q1', QuestionText: 'Define reflection.', Marks: '2', TimeAllowed: '45 minutes' },
      { ExamName: 'Science Practice Test', Class: 'Class 8', Subject: 'Science', Chapter: 'Light', QuestionNo: 'Q2', QuestionText: 'State the laws of reflection.', Marks: '3', TimeAllowed: '45 minutes' },
    ],
  },
  'ar-idcard-pro': {
    productName: 'AR-IDCARD-PRO',
    templateLabel: 'ID card template (text only)',
    excelLabel: 'Student/staff details Excel',
    outputLabel: 'ID cards',
    placeholders: ['{{FullName}}', '{{IDNumber}}', '{{Class}}', '{{Section}}', '{{Role}}', '{{AcademicYear}}', '{{BloodGroup}}', '{{ContactNumber}}'],
    rows: [
      { FullName: 'Aarya Rushi', IDNumber: 'ID-001', Class: 'Class 7', Section: 'A', Role: 'Student', AcademicYear: '2026-27', BloodGroup: 'O+', ContactNumber: '+91 90000 00000' },
      { FullName: 'Meera Nair', IDNumber: 'ID-002', Class: 'Class 7', Section: 'B', Role: 'Student', AcademicYear: '2026-27', BloodGroup: 'B+', ContactNumber: '+91 90000 00001' },
    ],
    note: 'Text placeholders only. Automated per-person photo/image placement is not included. For photo-based cards, keep a static/manual photo area in your Word template.',
  },
  'ar-invoice-pro': {
    productName: 'AR-INVOICE-PRO',
    templateLabel: 'Invoice template',
    excelLabel: 'Customer and item Excel',
    outputLabel: 'Invoices',
    placeholders: ['{{InvoiceNo}}', '{{InvoiceDate}}', '{{CustomerName}}', '{{CustomerAddress}}', '{{ItemName}}', '{{Quantity}}', '{{Rate}}', '{{Amount}}', '{{TotalAmount}}'],
    rows: [
      { InvoiceNo: 'INV-001', InvoiceDate: 'July 5, 2026', CustomerName: 'AaryaRushi Client', CustomerAddress: 'Hyderabad', ItemName: 'Automation setup', Quantity: '1', Rate: '5000', Amount: '5000', TotalAmount: '5000' },
      { InvoiceNo: 'INV-002', InvoiceDate: 'July 6, 2026', CustomerName: 'Nair Coaching', CustomerAddress: 'Kochi', ItemName: 'Report automation', Quantity: '2', Rate: '2500', Amount: '5000', TotalAmount: '5000' },
    ],
  },
  'ar-fee-receipt-pro': {
    productName: 'AR-FEE-RECEIPT-PRO',
    templateLabel: 'Fee receipt template',
    excelLabel: 'Student/payment Excel',
    outputLabel: 'Fee receipts',
    placeholders: ['{{ReceiptNo}}', '{{ReceiptDate}}', '{{StudentName}}', '{{RollNo}}', '{{Class}}', '{{FeeType}}', '{{AmountPaid}}', '{{PaymentMode}}', '{{Balance}}'],
    rows: [
      { ReceiptNo: 'RCPT-001', ReceiptDate: 'July 5, 2026', StudentName: 'Aarya Rushi', RollNo: 'ROLL-001', Class: 'Class 9', FeeType: 'Tuition', AmountPaid: '2500', PaymentMode: 'UPI', Balance: '0' },
      { ReceiptNo: 'RCPT-002', ReceiptDate: 'July 6, 2026', StudentName: 'Meera Nair', RollNo: 'ROLL-002', Class: 'Class 9', FeeType: 'Transport', AmountPaid: '1200', PaymentMode: 'Cash', Balance: '300' },
    ],
  },
}

export const sampleStarters = Object.fromEntries(
  Object.entries(rawSampleStarters).map(([slug, starter]) => [
    slug,
    { slug, columns: columnsFromPlaceholders(starter.placeholders), ...starter },
  ]),
)

export function getSampleStarter(slug) {
  return sampleStarters[slug] || null
}
