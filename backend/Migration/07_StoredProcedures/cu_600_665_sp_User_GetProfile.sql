-- =============================================
-- Stored Procedure: sp_User_GetProfile
-- Description: Gets user profile by ID
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_User_GetProfile]'))
    DROP PROCEDURE [dbo].[sp_User_GetProfile];
GO

CREATE PROCEDURE [dbo].[sp_User_GetProfile]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        UserID,
        Name,
        Email,
        Phone,
        ProfileImageURL,
        IsVendor,
        IsActive,
        CreatedAt
    FROM Users 
    WHERE UserID = @UserID;
END
GO
