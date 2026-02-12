-- =============================================
-- Stored Procedure: users.sp_GetPrivacySettings
-- Description: Get user privacy settings
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[sp_GetPrivacySettings]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [users].[sp_GetPrivacySettings]
GO

CREATE PROCEDURE [users].[sp_GetPrivacySettings]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        ShowReviews, 
        ShowForumPosts, 
        ShowForumComments, 
        ShowFavorites, 
        ShowOnlineStatus
    FROM users.UserPrivacySettings
    WHERE UserID = @UserID
END
GO
