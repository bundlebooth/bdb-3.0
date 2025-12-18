-- =============================================
-- Stored Procedure: sp_User_Insert2FACode
-- Description: Inserts a 2FA verification code
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_User_Insert2FACode]'))
    DROP PROCEDURE [dbo].[sp_User_Insert2FACode];
GO

CREATE PROCEDURE [dbo].[sp_User_Insert2FACode]
    @UserID INT,
    @CodeHash NVARCHAR(255),
    @Purpose NVARCHAR(50),
    @ExpiresAt DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO UserTwoFactorCodes (UserID, CodeHash, Purpose, ExpiresAt)
    VALUES (@UserID, @CodeHash, @Purpose, @ExpiresAt);
    
    SELECT SCOPE_IDENTITY() AS CodeID;
END
GO
