-- =============================================
-- Stored Procedure: sp_Admin_GetEnvironmentInfo
-- Description: Gets database server information for admin panel
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetEnvironmentInfo]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetEnvironmentInfo];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetEnvironmentInfo]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        @@SERVERNAME as serverName,
        DB_NAME() as databaseName,
        @@VERSION as sqlVersion;
END
GO
