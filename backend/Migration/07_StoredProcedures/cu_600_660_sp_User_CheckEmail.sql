-- =============================================
-- Stored Procedure: sp_User_CheckEmail
-- Description: Checks if email exists and gets vendor status
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_User_CheckEmail]'))
    DROP PROCEDURE [dbo].[sp_User_CheckEmail];
GO

CREATE PROCEDURE [dbo].[sp_User_CheckEmail]
    @Email NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT UserID, IsVendor 
    FROM Users 
    WHERE Email = @Email;
END
GO
