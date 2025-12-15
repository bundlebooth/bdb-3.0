# VV_DB Database Migration Scripts

## Overview

This folder contains all database migration scripts organized by deployment phase. Each script is numbered for sequential execution and includes existence checks to prevent duplicate object creation.

## Folder Structure

```
Migration/
├── 01_Schemas/          # Phase 000 - Database schemas
├── 02_Tables/           # Phase 100 - Table definitions
├── 03_Constraints/      # Phase 200 - DEFAULT and FK constraints
├── 04_Indexes/          # Phase 300 - Indexes and unique constraints
├── 05_Views/            # Phase 400 - Database views
├── 06_Functions/        # Phase 500 - User-defined functions (reserved)
├── 07_StoredProcedures/ # Phase 600 - Stored procedures
├── 08_Triggers/         # Phase 700 - Database triggers (reserved)
├── 09_Permissions/      # Phase 800 - Security and permissions
├── 10_Data/             # Phase 900 - Seed/reference data
├── Deploy_All.sql       # Master deployment guide
└── README.md            # This file
```

## Naming Convention

Scripts follow this naming pattern:
```
cu_[PHASE]_[ORDER]_[SCHEMA].[OBJECT].sql
```

Examples:
- `cu_000_01_CreateSchemas.sql` - Schema creation (Phase 0, Order 1)
- `cu_100_01_dbo.Users.sql` - Users table (Phase 100, Order 1)
- `cu_200_02_ForeignKeyConstraints.sql` - FK constraints (Phase 200, Order 2)
- `cu_600_001_dbo.sp_AcceptCounterOffer.sql` - Stored procedure (Phase 600, Order 1)

## Deployment Order

Execute scripts in numerical order by phase:

| Phase | Folder | Description | Script Count |
|-------|--------|-------------|--------------|
| 000 | 01_Schemas | Database schemas | 1 |
| 100 | 02_Tables | Table definitions | 64 |
| 200 | 03_Constraints | DEFAULT and FK constraints | 2 |
| 300 | 04_Indexes | Indexes and unique constraints | 1 |
| 400 | 05_Views | Database views | 15 |
| 600 | 07_StoredProcedures | Stored procedures | 119 |
| 800 | 09_Permissions | Security and permissions | 1 |
| 900 | 10_Data | Production data (INSERT statements) | 43 |

**Total: 248 scripts**

## Execution Instructions

### Using SQL Executor

1. Connect to target database
2. Execute scripts in numerical order within each phase folder
3. Scripts are idempotent - safe to re-run

### Manual Execution Order

```
1. 01_Schemas\cu_000_01_CreateSchemas.sql

2. 02_Tables\cu_100_01_dbo.Users.sql
   02_Tables\cu_100_02_dbo.PlatformFAQs.sql
   ... (through cu_100_64_dbo.FAQFeedback.sql)

3. 03_Constraints\cu_200_01_DefaultConstraints.sql
   03_Constraints\cu_200_02_ForeignKeyConstraints.sql

4. 04_Indexes\cu_300_01_Indexes.sql

5. 05_Views\cu_400_01_dbo.vw_InvoicesList.sql
   ... (through cu_400_15_dbo.vw_VendorTrending.sql)

6. 07_StoredProcedures\cu_600_001_dbo.sp_AcceptCounterOffer.sql
   ... (through cu_600_119_dbo.sp_UpsertVendorService.sql)

7. 09_Permissions\cu_800_01_DatabasePermissions.sql

8. 10_Data\cu_900_01_dbo.Users.sql
   ... (through cu_900_43_dbo.FAQFeedback.sql)
```

## Features

### Existence Checks
All scripts check if the object exists before creating:
- Tables: `IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TableName]'))`
- Views: `IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[dbo].[ViewName]'))`
- Stored Procedures: `IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[ProcName]'))`
- Schemas: `IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'SchemaName')`

### Schemas Created
- `dbo` - Default schema (main application objects)
- `staging` - ETL/data migration operations
- `audit` - Audit and logging tables
- `archive` - Archived data

### Database Roles Created
- `VV_DB_Reader` - SELECT permissions
- `VV_DB_Writer` - INSERT, UPDATE, DELETE permissions
- `VV_DB_Executor` - EXECUTE permissions on stored procedures
- `VV_DB_Admin` - Full control

## Pre-Deployment Checklist

- [ ] Backup target database
- [ ] Verify database connection
- [ ] Review permissions script for environment-specific settings
- [ ] Prepare seed data scripts if needed
- [ ] Test in non-production environment first

## Post-Deployment Verification

Run these queries to verify deployment:

```sql
-- Count tables
SELECT COUNT(*) AS TableCount FROM sys.tables WHERE schema_id = SCHEMA_ID('dbo');

-- Count views
SELECT COUNT(*) AS ViewCount FROM sys.views WHERE schema_id = SCHEMA_ID('dbo');

-- Count stored procedures
SELECT COUNT(*) AS SPCount FROM sys.procedures WHERE schema_id = SCHEMA_ID('dbo');

-- Count schemas
SELECT COUNT(*) AS SchemaCount FROM sys.schemas WHERE name IN ('dbo', 'staging', 'audit', 'archive');
```

Expected counts:
- Tables: 64
- Views: 15
- Stored Procedures: 119
- Schemas: 4

## Troubleshooting

### Script fails with "Object already exists"
Scripts include existence checks, but if you encounter this:
1. The object was created outside this migration
2. Check if the object needs to be dropped first

### Foreign key constraint fails
Ensure tables are created in the correct order (Phase 100 before Phase 200).

### Permission denied
Run the permissions script (Phase 800) or ensure you have db_owner rights.

## Notes

- Original scripts are preserved in the `Scripts/` folder
- This migration was generated from the existing database schema
- Customize seed data scripts in `10_Data/` for your environment
