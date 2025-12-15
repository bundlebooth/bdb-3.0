-- =============================================
-- Stored Procedure: sp_GetUserForLogin
-- Description: Gets user details for login authentication
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetUserForLogin]'))
    DROP PROCEDURE [dbo].[sp_GetUserForLogin];
GO

CREATE PROCEDURE [dbo].[sp_GetUserForLogin]
    @Email NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        u.UserID, 
        u.Name, 
        u.Email, 
        u.PasswordHash, 
        u.IsVendor,
        u.IsAdmin,
        u.IsActive,
        v.VendorProfileID
    FROM Users u
    LEFT JOIN VendorProfiles v ON u.UserID = v.UserID
    WHERE u.Email = @Email;
END
GO
