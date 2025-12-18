-- =============================================
-- Stored Procedure: sp_User_Mark2FAUsed
-- Description: Marks 2FA code as used
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_User_Mark2FAUsed]'))
    DROP PROCEDURE [dbo].[sp_User_Mark2FAUsed];
GO

CREATE PROCEDURE [dbo].[sp_User_Mark2FAUsed]
    @CodeID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE UserTwoFactorCodes SET IsUsed = 1, Attempts = Attempts + 1 WHERE CodeID = @CodeID;
END
GO
