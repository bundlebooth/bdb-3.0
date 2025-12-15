/*
    Migration Script: Database Permissions and Security
    Phase: 800 - Permissions
    Script: cu_800_01_DatabasePermissions.sql
    Description: Sets up database roles, users, and permissions
    
    Execution Order: 1
    
    NOTE: Customize these permissions based on your environment.
    The following are template permissions - adjust as needed for production.
*/

SET NOCOUNT ON;
GO

PRINT 'Setting up database permissions...';
GO

-- =============================================
-- Create Application Roles
-- =============================================

-- Application Read Role
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'VV_DB_Reader' AND type = 'R')
BEGIN
    CREATE ROLE [VV_DB_Reader];
    PRINT 'Role [VV_DB_Reader] created.';
END
ELSE
BEGIN
    PRINT 'Role [VV_DB_Reader] already exists. Skipping.';
END
GO

-- Application Write Role
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'VV_DB_Writer' AND type = 'R')
BEGIN
    CREATE ROLE [VV_DB_Writer];
    PRINT 'Role [VV_DB_Writer] created.';
END
ELSE
BEGIN
    PRINT 'Role [VV_DB_Writer] already exists. Skipping.';
END
GO

-- Application Execute Role (for stored procedures)
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'VV_DB_Executor' AND type = 'R')
BEGIN
    CREATE ROLE [VV_DB_Executor];
    PRINT 'Role [VV_DB_Executor] created.';
END
ELSE
BEGIN
    PRINT 'Role [VV_DB_Executor] already exists. Skipping.';
END
GO

-- Application Admin Role
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'VV_DB_Admin' AND type = 'R')
BEGIN
    CREATE ROLE [VV_DB_Admin];
    PRINT 'Role [VV_DB_Admin] created.';
END
ELSE
BEGIN
    PRINT 'Role [VV_DB_Admin] already exists. Skipping.';
END
GO

-- =============================================
-- Grant Permissions to Roles
-- =============================================

-- Reader Role: SELECT on all tables and views
GRANT SELECT ON SCHEMA::dbo TO [VV_DB_Reader];
PRINT 'SELECT permissions granted to [VV_DB_Reader].';
GO

-- Writer Role: INSERT, UPDATE, DELETE on all tables
GRANT INSERT, UPDATE, DELETE ON SCHEMA::dbo TO [VV_DB_Writer];
PRINT 'INSERT, UPDATE, DELETE permissions granted to [VV_DB_Writer].';
GO

-- Executor Role: EXECUTE on all stored procedures
GRANT EXECUTE ON SCHEMA::dbo TO [VV_DB_Executor];
PRINT 'EXECUTE permissions granted to [VV_DB_Executor].';
GO

-- Admin Role: Full control
GRANT CONTROL ON SCHEMA::dbo TO [VV_DB_Admin];
GRANT CONTROL ON SCHEMA::staging TO [VV_DB_Admin];
GRANT CONTROL ON SCHEMA::audit TO [VV_DB_Admin];
GRANT CONTROL ON SCHEMA::archive TO [VV_DB_Admin];
PRINT 'CONTROL permissions granted to [VV_DB_Admin].';
GO

-- =============================================
-- Grant Permissions on Schemas
-- =============================================

-- Staging schema permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::staging TO [VV_DB_Writer];
GRANT SELECT ON SCHEMA::staging TO [VV_DB_Reader];
PRINT 'Staging schema permissions granted.';
GO

-- Audit schema permissions (read-only for most, write for admin)
GRANT SELECT ON SCHEMA::audit TO [VV_DB_Reader];
GRANT INSERT ON SCHEMA::audit TO [VV_DB_Writer];
PRINT 'Audit schema permissions granted.';
GO

-- Archive schema permissions
GRANT SELECT ON SCHEMA::archive TO [VV_DB_Reader];
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::archive TO [VV_DB_Admin];
PRINT 'Archive schema permissions granted.';
GO

PRINT 'Database permissions setup completed.';
GO
