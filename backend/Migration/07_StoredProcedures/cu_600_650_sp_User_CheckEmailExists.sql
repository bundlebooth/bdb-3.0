-- =============================================
-- Stored Procedure: sp_User_CheckEmailExists
-- Description: Checks if email already exists
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_User_CheckEmailExists]'))
    DROP PROCEDURE [dbo].[sp_User_CheckEmailExists];
GO

CREATE PROCEDURE [dbo].[sp_User_CheckEmailExists]
    @Email NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 1 AS EmailExists FROM Users WHERE Email = @Email;
END
GO
