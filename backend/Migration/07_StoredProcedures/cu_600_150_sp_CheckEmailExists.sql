-- =============================================
-- Stored Procedure: sp_CheckEmailExists
-- Description: Checks if an email exists in the Users table
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_CheckEmailExists]'))
    DROP PROCEDURE [dbo].[sp_CheckEmailExists];
GO

CREATE PROCEDURE [dbo].[sp_CheckEmailExists]
    @Email NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 1 AS EmailExists FROM Users WHERE Email = @Email;
END
GO
