-- =============================================
-- Stored Procedure: sp_User_GetLoginInfo
-- Description: Gets user info for login
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_User_GetLoginInfo]'))
    DROP PROCEDURE [dbo].[sp_User_GetLoginInfo];
GO

CREATE PROCEDURE [dbo].[sp_User_GetLoginInfo]
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
