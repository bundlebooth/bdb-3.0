-- =============================================
-- Stored Procedure: users.sp_GetLoginInfo
-- Description: Gets user info for login
-- Phase: 600 (Stored Procedures)
-- Schema: users
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

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
        u.FirstName,
        u.LastName,
        u.Email, 
        u.PasswordHash, 
        u.IsVendor,
        u.IsAdmin,
        u.IsActive,
        v.VendorProfileID,
        -- Login security fields
        ISNULL(u.FailedLoginAttempts, 0) AS FailedLoginAttempts,
        u.LastFailedLoginAt,
        ISNULL(u.IsLocked, 0) AS IsLocked,
        u.LockExpiresAt,
        u.LockReason,
        ISNULL(u.PasswordResetRequired, 0) AS PasswordResetRequired,
        -- Soft delete fields
        ISNULL(u.IsDeleted, 0) AS IsDeleted,
        u.DeletedAt
    FROM users.Users u
    LEFT JOIN vendors.VendorProfiles v ON u.UserID = v.UserID
    WHERE u.Email = @Email;
END
GO


