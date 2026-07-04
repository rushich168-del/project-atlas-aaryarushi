# Certificate Template Placeholder Reference

Create a Word `.docx` certificate template and include these placeholders exactly as shown.

## Recommended Placeholders

```text
{{name}}
{{course}}
{{date}}
{{certificate_id}}
{{grade}}
```

## Suggested Certificate Text

```text
Certificate of Completion

This certificate is awarded to {{name}}
for successfully completing {{course}}
on {{date}}.

Grade: {{grade}}
Certificate ID: {{certificate_id}}
```

## Mapping Notes

The sample CSV uses these columns:

```text
Name
Course
Date
Grade
Certificate_ID
Email
```

When using Auto-map:

- `{{name}}` should map to `Name`.
- `{{course}}` should map to `Course`.
- `{{date}}` should map to `Date`.
- `{{certificate_id}}` should map to `Certificate_ID`.
- `{{grade}}` can be mapped manually if needed.

## Demo Boundary

AR-CERT-PRO currently demonstrates DOCX generation. Do not present PDF export, Gmail/Outlook OAuth, billing, controlled real batch send, or failed-row resend as live demo features.
