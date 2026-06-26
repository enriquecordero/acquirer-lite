---
applyTo: "db/**"
---

# Database Layer Instructions

- **SQL Server 2022** in container
- T-SQL naming: PascalCase for tables and columns
- Use `NVARCHAR` for text that may contain unicode, `VARCHAR` for codes/tokens
- All FKs explicitly declared with `REFERENCES`
- Use `CHECK` constraints for enum-like columns
- **HARD RULE:** No column stores PAN, CVV, or cardholder data — only token references (`CardTokenRef`)
- Use **MSSQL extension** tools for schema awareness and SQL injection detection
