-- =============================================
-- Schema: forum
-- Description: Forum/Community discussion schema
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'forum')
BEGIN
    EXEC('CREATE SCHEMA [forum]');
END
GO
