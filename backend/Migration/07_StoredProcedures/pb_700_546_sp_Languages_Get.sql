/*
    Migration Script: Create Stored Procedure [sp_GetLanguages]
    Phase: 700 - Stored Procedures
    Script: pb_700_546_sp_Languages_Get.sql
    Description: Gets available languages for user profile
*/

SET NOCOUNT ON;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[sp_GetLanguages]') AND type in (N'P'))
    DROP PROCEDURE [admin].[sp_GetLanguages];
GO

CREATE PROCEDURE [admin].[sp_GetLanguages]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT LanguageID, Code, Name, NativeName
    FROM admin.Languages
    WHERE IsActive = 1
    ORDER BY DisplayOrder, Name;
END
GO

PRINT 'Created stored procedure [admin].[sp_GetLanguages]';
GO
