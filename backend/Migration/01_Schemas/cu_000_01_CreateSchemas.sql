/*
    Migration Script: Create Schemas
    Phase: 000 - Schemas
    Script: cu_000_01_CreateSchemas.sql
    Description: Creates all required schemas for the VV_DB database
    
    Execution Order: 1
*/

SET NOCOUNT ON;
GO

PRINT 'Creating schemas...';
GO

-- Create dbo schema (exists by default, but included for completeness)
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'dbo')
BEGIN
    EXEC('CREATE SCHEMA [dbo]');
    PRINT 'Schema [dbo] created.';
END
ELSE
BEGIN
    PRINT 'Schema [dbo] already exists. Skipping.';
END
GO

-- Create staging schema for ETL/data migration operations
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'staging')
BEGIN
    EXEC('CREATE SCHEMA [staging]');
    PRINT 'Schema [staging] created.';
END
ELSE
BEGIN
    PRINT 'Schema [staging] already exists. Skipping.';
END
GO

-- Create audit schema for audit/logging tables
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'audit')
BEGIN
    EXEC('CREATE SCHEMA [audit]');
    PRINT 'Schema [audit] created.';
END
ELSE
BEGIN
    PRINT 'Schema [audit] already exists. Skipping.';
END
GO

-- Create archive schema for archived data
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'archive')
BEGIN
    EXEC('CREATE SCHEMA [archive]');
    PRINT 'Schema [archive] created.';
END
ELSE
BEGIN
    PRINT 'Schema [archive] already exists. Skipping.';
END
GO

PRINT 'Schema creation completed.';
GO
