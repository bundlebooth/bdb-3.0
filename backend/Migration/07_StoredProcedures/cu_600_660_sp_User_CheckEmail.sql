-- =============================================
-- Stored Procedure: users.sp_CheckEmail
-- Description: Checks if email exists and gets vendor status
-- Phase: 600 (Stored Procedures)
-- Schema: users
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_CheckEmail]'))
    DROP PROCEDURE [users].[sp_CheckEmail];
GO

CREATE PROCEDURE [users].[sp_CheckEmail]
    @Email NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT UserID, IsVendor 
    FROM users.Users 
    WHERE Email = @Email;
END
GO

