-- =============================================
-- Stored Procedure: admin.sp_GetEnvironmentInfo
-- Description: Gets database server information for admin panel
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetEnvironmentInfo]'))
    DROP PROCEDURE [admin].[sp_GetEnvironmentInfo];
GO

CREATE PROCEDURE [admin].[sp_GetEnvironmentInfo]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        @@SERVERNAME as serverName,
        DB_NAME() as databaseName,
        @@VERSION as sqlVersion;
END
GO
