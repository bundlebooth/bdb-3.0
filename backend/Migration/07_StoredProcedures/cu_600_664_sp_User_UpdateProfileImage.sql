-- =============================================
-- Stored Procedure: users.sp_UpdateProfileImage
-- Description: Updates user profile image URL
-- Phase: 600 (Stored Procedures)
-- Schema: users
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_UpdateProfileImage]'))
    DROP PROCEDURE [users].[sp_UpdateProfileImage];
GO

CREATE PROCEDURE [users].[sp_UpdateProfileImage]
    @UserID INT,
    @ProfileImageURL NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE users.Users 
    SET ProfileImageURL = @ProfileImageURL, UpdatedAt = GETDATE()
    WHERE UserID = @UserID;
END
GO

