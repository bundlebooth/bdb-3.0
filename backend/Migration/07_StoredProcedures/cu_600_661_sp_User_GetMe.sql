-- =============================================
-- Stored Procedure: users.sp_GetMe
-- Description: Gets current user info
-- Phase: 600 (Stored Procedures)
-- Schema: users
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetMe]'))
    DROP PROCEDURE [users].[sp_GetMe];
GO

CREATE PROCEDURE [users].[sp_GetMe]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        UserID as userId,
        Name as name,
        Email as email,
        ProfileImageURL as avatar,
        IsVendor as isVendor
    FROM users.Users 
    WHERE UserID = @UserID;
END
GO

