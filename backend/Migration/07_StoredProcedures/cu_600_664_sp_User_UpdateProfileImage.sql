-- =============================================
-- Stored Procedure: sp_User_UpdateProfileImage
-- Description: Updates user profile image URL
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_User_UpdateProfileImage]'))
    DROP PROCEDURE [dbo].[sp_User_UpdateProfileImage];
GO

CREATE PROCEDURE [dbo].[sp_User_UpdateProfileImage]
    @UserID INT,
    @ProfileImageURL NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Users 
    SET ProfileImageURL = @ProfileImageURL, UpdatedAt = GETDATE()
    WHERE UserID = @UserID;
END
GO
