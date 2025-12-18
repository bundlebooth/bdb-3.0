-- =============================================
-- Stored Procedure: users.sp_GetPasswordHash
-- Description: Gets user password hash for verification
-- Phase: 600 (Stored Procedures)
-- Schema: users
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetPasswordHash]'))
    DROP PROCEDURE [users].[sp_GetPasswordHash];
GO

CREATE PROCEDURE [users].[sp_GetPasswordHash]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT PasswordHash FROM users.Users WHERE UserID = @UserID;
END
GO

