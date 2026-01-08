-- =============================================
-- Stored Procedure: users.sp_Get2FACode
-- Description: Gets latest 2FA code for user
-- Phase: 600 (Stored Procedures)
-- Schema: users
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_Get2FACode]'))
    DROP PROCEDURE [users].[sp_Get2FACode];
GO

CREATE PROCEDURE [users].[sp_Get2FACode]
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
