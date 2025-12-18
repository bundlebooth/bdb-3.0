-- =============================================
-- Stored Procedure: sp_Admin_GetUsersWithTwoFactor
-- Description: Gets users with 2FA enabled
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetUsersWithTwoFactor]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetUsersWithTwoFactor];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetUsersWithTwoFactor]
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
    FROM Users u
    WHERE 1 = 0  -- No 2FA support yet
    ORDER BY u.Name;
END
GO
