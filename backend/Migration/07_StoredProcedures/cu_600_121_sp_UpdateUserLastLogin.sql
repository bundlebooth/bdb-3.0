-- =============================================
-- Stored Procedure: sp_UpdateUserLastLogin
-- Description: Updates user's last login timestamp
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_UpdateUserLastLogin]'))
    DROP PROCEDURE [dbo].[sp_UpdateUserLastLogin];
GO

CREATE PROCEDURE [dbo].[sp_UpdateUserLastLogin]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Users SET LastLogin = GETDATE() WHERE UserID = @UserID;
END
GO
