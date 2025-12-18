-- =============================================
-- Stored Procedure: sp_Admin_ResetUser2FA
-- Description: Resets 2FA for a user
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_ResetUser2FA]'))
    DROP PROCEDURE [dbo].[sp_Admin_ResetUser2FA];
GO

CREATE PROCEDURE [dbo].[sp_Admin_ResetUser2FA]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Note: TwoFactorEnabled and TwoFactorSecret columns do not exist in Users table
    -- This SP is a placeholder until 2FA columns are added to Users table
    
    -- Delete any pending 2FA codes if table exists
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'UserTwoFactorCodes')
    BEGIN
        DELETE FROM UserTwoFactorCodes WHERE UserID = @UserID;
    END
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
