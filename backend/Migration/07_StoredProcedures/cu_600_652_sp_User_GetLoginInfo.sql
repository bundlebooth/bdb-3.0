-- =============================================
-- Stored Procedure: users.sp_GetLoginInfo
-- Description: Gets user info for login
-- Phase: 600 (Stored Procedures)
-- Schema: users
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetLoginInfo]'))
    DROP PROCEDURE [users].[sp_GetLoginInfo];
GO

CREATE PROCEDURE [users].[sp_GetLoginInfo]
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
    FROM users.Users u
    LEFT JOIN vendors.VendorProfiles v ON u.UserID = v.UserID
    WHERE u.Email = @Email;
END
GO


