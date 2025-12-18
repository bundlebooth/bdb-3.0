-- =============================================
-- Stored Procedure: sp_User_Get2FACode
-- Description: Gets latest 2FA code for user
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_User_Get2FACode]'))
    DROP PROCEDURE [dbo].[sp_User_Get2FACode];
GO

CREATE PROCEDURE [dbo].[sp_User_Get2FACode]
    @UserID INT,
    @Purpose NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 CodeID, CodeHash, ExpiresAt, Attempts, IsUsed
    FROM UserTwoFactorCodes
    WHERE UserID = @UserID AND Purpose = @Purpose AND IsUsed = 0
    ORDER BY CreatedAt DESC;
END
GO
