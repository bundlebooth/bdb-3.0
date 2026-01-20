-- =============================================
-- Stored Procedure: users.sp_Mark2FAUsed
-- Description: Marks 2FA code as used
-- Phase: 600 (Stored Procedures)
-- Schema: users
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_Mark2FAUsed]'))
    DROP PROCEDURE [users].[sp_Mark2FAUsed];
GO

CREATE PROCEDURE [users].[sp_Mark2FAUsed]
    @CodeID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE users.UserTwoFactorCodes SET IsUsed = 1, Attempts = Attempts + 1 WHERE CodeID = @CodeID;
END
GO
