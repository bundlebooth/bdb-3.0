-- =============================================
-- Stored Procedure: sp_User_UpdateLastLogin
-- Description: Updates user's last login time
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_User_UpdateLastLogin]'))
    DROP PROCEDURE [dbo].[sp_User_UpdateLastLogin];
GO

CREATE PROCEDURE [dbo].[sp_User_UpdateLastLogin]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Users SET LastLogin = GETUTCDATE() WHERE UserID = @UserID;
END
GO
