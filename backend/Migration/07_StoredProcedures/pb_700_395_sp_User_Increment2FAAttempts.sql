-- =============================================
-- Stored Procedure: users.sp_Increment2FAAttempts
-- Description: Increments 2FA code attempts
-- Phase: 600 (Stored Procedures)
-- Schema: users
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_Increment2FAAttempts]'))
    DROP PROCEDURE [users].[sp_Increment2FAAttempts];
GO

CREATE PROCEDURE [users].[sp_Increment2FAAttempts]
    @CodeID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE users.UserTwoFactorCodes SET Attempts = Attempts + 1 WHERE CodeID = @CodeID;
END
GO
