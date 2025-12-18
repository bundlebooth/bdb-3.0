-- =============================================
-- Stored Procedure: sp_User_GetMe
-- Description: Gets current user info
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_User_GetMe]'))
    DROP PROCEDURE [dbo].[sp_User_GetMe];
GO

CREATE PROCEDURE [dbo].[sp_User_GetMe]
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
    FROM Users 
    WHERE UserID = @UserID;
END
GO
