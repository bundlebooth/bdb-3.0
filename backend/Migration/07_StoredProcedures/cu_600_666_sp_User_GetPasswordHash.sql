-- =============================================
-- Stored Procedure: sp_User_GetPasswordHash
-- Description: Gets user password hash for verification
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_User_GetPasswordHash]'))
    DROP PROCEDURE [dbo].[sp_User_GetPasswordHash];
GO

CREATE PROCEDURE [dbo].[sp_User_GetPasswordHash]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT PasswordHash FROM Users WHERE UserID = @UserID;
END
GO
