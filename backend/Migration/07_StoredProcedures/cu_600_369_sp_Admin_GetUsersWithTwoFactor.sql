-- =============================================
-- Stored Procedure: admin.sp_GetUsersWithTwoFactor
-- Description: Gets users with 2FA enabled
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetUsersWithTwoFactor]'))
    DROP PROCEDURE [admin].[sp_GetUsersWithTwoFactor];
GO

CREATE PROCEDURE [admin].[sp_GetUsersWithTwoFactor]
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Return admin users with 2FA status
    SELECT 
        u.UserID,
        u.Name,
        u.Email,
        u.IsVendor,
        u.IsAdmin,
        CASE WHEN EXISTS (
            SELECT 1 FROM users.UserTwoFactorCodes c 
            WHERE c.UserID = u.UserID AND c.IsUsed = 1
        ) THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END as TwoFactorEnabled,
        u.CreatedAt,
        u.LastLogin
    FROM users.Users u
    WHERE u.IsAdmin = 1
    ORDER BY u.Name;
END
GO

