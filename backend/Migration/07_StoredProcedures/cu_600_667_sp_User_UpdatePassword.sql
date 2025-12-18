-- =============================================
-- Stored Procedure: users.sp_UpdatePassword
-- Description: Updates user password hash
-- Phase: 600 (Stored Procedures)
-- Schema: users
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_UpdatePassword]'))
    DROP PROCEDURE [users].[sp_UpdatePassword];
GO

CREATE PROCEDURE [users].[sp_UpdatePassword]
    @UserID INT,
    @PasswordHash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE users.Users SET PasswordHash = @PasswordHash WHERE UserID = @UserID;
END
GO

