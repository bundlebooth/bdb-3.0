-- =============================================
-- Stored Procedure: users.sp_Insert2FACode
-- Description: Inserts a two-factor authentication code
-- Phase: 600 (Stored Procedures)
-- Schema: users
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_Insert2FACode]'))
    DROP PROCEDURE [users].[sp_Insert2FACode];
GO

CREATE PROCEDURE [users].[sp_Insert2FACode]
    @UserID INT,
    @CodeHash NVARCHAR(255),
    @Purpose NVARCHAR(50),
    @ExpiresAt DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO UserTwoFactorCodes (UserID, CodeHash, Purpose, ExpiresAt)
    VALUES (@UserID, @CodeHash, @Purpose, @ExpiresAt);
END
GO
