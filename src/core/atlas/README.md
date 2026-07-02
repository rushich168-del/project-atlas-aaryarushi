# Atlas Core

Atlas Core is the reusable validation and document-preparation layer for Project Atlas automation products.

It helps products verify and prepare document automation workflows:

- DOCX templates contain valid `{{placeholder_name}}` tokens
- Required fields are mapped
- Mapped Excel columns exist
- Unknown placeholders are surfaced as warnings
- Extra Excel columns are reported without blocking readiness
- One valid merge result can render a DOCX from a template in the browser

Supported placeholder format:

```txt
{{name}}
{{course}}
{{certificate_id}}
```

Rules:

- normalized to lowercase
- starts with a letter
- allows letters, numbers, and underscores
- spaces and symbols are invalid

Browser-side DOCX detection reads:

- `word/document.xml`
- `word/header*.xml`
- `word/footer*.xml`

DOCX generation is currently limited to one browser-side document at a time. PDF export, batch jobs, output storage, background jobs, and server-side generation are intentionally out of scope.
