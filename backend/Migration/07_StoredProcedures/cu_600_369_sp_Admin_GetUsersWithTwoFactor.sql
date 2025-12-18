-- =============================================
-- Stored Procedure: admin.sp_GetUsersWithTwoFactor
-- Description: Gets users with 2FA enabled
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetUsersWithTwoFactor]'))
    DROP PROCEDURE [admin].[sp_GetUsersWithTwoFactor];
GO

CREATE PROCEDURE [admin].[sp_GetUsersWithTwoFactor]
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Note: TwoFactorEnabled column does not exist in Users table
    -- This SP returns empty result set until 2FA columns are added
    SELECT 
        u.UserID,
        u.Name,
        u.Email,
        u.IsVendor,
        u.IsAdmin,
        CAST(0 AS BIT) as TwoFactorEnabled,
        u.CreatedAt,
        u.LastLogin
    FROM users.Users u
    WHERE 1 = 0  -- No 2FA support yet
    ORDER BY u.Name;
END
GO

