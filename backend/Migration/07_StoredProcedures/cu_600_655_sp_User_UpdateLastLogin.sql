-- =============================================
-- Stored Procedure: users.sp_UpdateLastLogin
-- Description: Updates user's last login time
-- Phase: 600 (Stored Procedures)
-- Schema: users
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_UpdateLastLogin]'))
    DROP PROCEDURE [users].[sp_UpdateLastLogin];
GO

CREATE PROCEDURE [users].[sp_UpdateLastLogin]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE users.Users SET LastLogin = GETUTCDATE() WHERE UserID = @UserID;
END
GO

