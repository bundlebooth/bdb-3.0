-- =============================================
-- Stored Procedure: users.sp_GetForLogin
-- Description: Gets user details for login authentication
-- Phase: 600 (Stored Procedures)
-- Schema: users
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetForLogin]'))
    DROP PROCEDURE [users].[sp_GetForLogin];
GO

CREATE PROCEDURE [users].[sp_GetForLogin]
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


