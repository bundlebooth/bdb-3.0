-- =============================================
-- Stored Procedure: sp_User_UpdatePassword
-- Description: Updates user password hash
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_User_UpdatePassword]'))
    DROP PROCEDURE [dbo].[sp_User_UpdatePassword];
GO

CREATE PROCEDURE [dbo].[sp_User_UpdatePassword]
    @UserID INT,
    @PasswordHash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Users SET PasswordHash = @PasswordHash WHERE UserID = @UserID;
END
GO
