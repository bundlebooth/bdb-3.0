-- =============================================
-- Stored Procedure: users.sp_Toggle2FA
-- Description: Enables or disables two-factor authentication for a user
-- Phase: 700 (Stored Procedures)
-- Schema: users
-- =============================================

SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_Toggle2FA]'))
    DROP PROCEDURE [users].[sp_Toggle2FA];
GO

CREATE PROCEDURE [users].[sp_Toggle2FA]
    @UserID INT,
    @Enabled BIT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Update 2FA status
    UPDATE users.Users
    SET TwoFactorEnabled = @Enabled,
        UpdatedAt = GETDATE()
    WHERE UserID = @UserID;
    
    -- Return the updated status
    SELECT @Enabled as TwoFactorEnabled;
END
GO

PRINT 'Created stored procedure users.sp_Toggle2FA';
GO
