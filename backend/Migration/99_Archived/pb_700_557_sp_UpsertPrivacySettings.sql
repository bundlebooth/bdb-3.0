-- =============================================
-- Stored Procedure: users.sp_UpsertPrivacySettings
-- Description: Insert or update user privacy settings
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[sp_UpsertPrivacySettings]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [users].[sp_UpsertPrivacySettings]
GO

CREATE PROCEDURE [users].[sp_UpsertPrivacySettings]
    @UserID INT,
    @ShowReviews BIT,
    @ShowForumPosts BIT,
    @ShowForumComments BIT,
    @ShowFavorites BIT,
    @ShowOnlineStatus BIT
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM users.UserPrivacySettings WHERE UserID = @UserID)
    BEGIN
        UPDATE users.UserPrivacySettings
        SET ShowReviews = @ShowReviews,
            ShowForumPosts = @ShowForumPosts,
            ShowForumComments = @ShowForumComments,
            ShowFavorites = @ShowFavorites,
            ShowOnlineStatus = @ShowOnlineStatus,
            UpdatedAt = GETDATE()
        WHERE UserID = @UserID
    END
    ELSE
    BEGIN
        INSERT INTO users.UserPrivacySettings (UserID, ShowReviews, ShowForumPosts, ShowForumComments, ShowFavorites, ShowOnlineStatus, CreatedAt)
        VALUES (@UserID, @ShowReviews, @ShowForumPosts, @ShowForumComments, @ShowFavorites, @ShowOnlineStatus, GETDATE())
    END
END
GO
