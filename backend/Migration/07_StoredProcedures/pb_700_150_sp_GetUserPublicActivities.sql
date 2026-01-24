-- =============================================
-- Stored Procedure: users.sp_GetUserPublicActivities
-- Description: Gets public user activities for profile display
--              Includes reviews, forum posts, forum comments, favorites
-- Phase: 700 (Stored Procedures)
-- Schema: users
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetUserPublicActivities]'))
    DROP PROCEDURE [users].[sp_GetUserPublicActivities];
GO

CREATE PROCEDURE [users].[sp_GetUserPublicActivities]
    @UserID INT,
    @Limit INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Create temp table to hold all activities
    CREATE TABLE #Activities (
        ActivityType NVARCHAR(50),
        ActivityID INT,
        Title NVARCHAR(500),
        Description NVARCHAR(MAX),
        TargetID INT,
        TargetName NVARCHAR(255),
        TargetURL NVARCHAR(500),
        Rating INT NULL,
        ImageURL NVARCHAR(500) NULL,
        CreatedAt DATETIME
    );
    
    -- Get reviews given by user
    INSERT INTO #Activities (ActivityType, ActivityID, Title, Description, TargetID, TargetName, TargetURL, Rating, ImageURL, CreatedAt)
    SELECT TOP (@Limit)
        'review' as ActivityType,
        r.ReviewID as ActivityID,
        'Reviewed ' + vp.BusinessName as Title,
        r.Comment as Description,
        r.VendorProfileID as TargetID,
        vp.BusinessName as TargetName,
        '/vendor/' + CAST(vp.VendorProfileID as NVARCHAR) as TargetURL,
        r.Rating,
        vp.LogoURL as ImageURL,
        r.CreatedAt
    FROM vendors.Reviews r
    JOIN vendors.VendorProfiles vp ON r.VendorProfileID = vp.VendorProfileID
    WHERE r.UserID = @UserID
    ORDER BY r.CreatedAt DESC;
    
    -- Get forum posts created by user
    IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[forum].[ForumPosts]'))
    BEGIN
        INSERT INTO #Activities (ActivityType, ActivityID, Title, Description, TargetID, TargetName, TargetURL, Rating, ImageURL, CreatedAt)
        SELECT TOP (@Limit)
            'forum_post' as ActivityType,
            fp.PostID as ActivityID,
            'Created a discussion: ' + fp.Title as Title,
            LEFT(fp.Content, 200) as Description,
            fp.PostID as TargetID,
            fp.Title as TargetName,
            '/forum/post/' + fp.Slug as TargetURL,
            NULL as Rating,
            fp.ImageURL as ImageURL,
            fp.CreatedAt
        FROM forum.ForumPosts fp
        WHERE fp.AuthorID = @UserID AND fp.IsDeleted = 0
        ORDER BY fp.CreatedAt DESC;
    END
    
    -- Get forum comments by user
    IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[forum].[ForumComments]'))
    BEGIN
        INSERT INTO #Activities (ActivityType, ActivityID, Title, Description, TargetID, TargetName, TargetURL, Rating, ImageURL, CreatedAt)
        SELECT TOP (@Limit)
            'forum_comment' as ActivityType,
            fc.CommentID as ActivityID,
            'Replied to: ' + fp.Title as Title,
            LEFT(fc.Content, 200) as Description,
            fp.PostID as TargetID,
            fp.Title as TargetName,
            '/forum/post/' + fp.Slug as TargetURL,
            NULL as Rating,
            fp.ImageURL as ImageURL,
            fc.CreatedAt
        FROM forum.ForumComments fc
        JOIN forum.ForumPosts fp ON fc.PostID = fp.PostID
        WHERE fc.AuthorID = @UserID AND fc.IsDeleted = 0 AND fp.IsDeleted = 0
        ORDER BY fc.CreatedAt DESC;
    END
    
    -- Get favorites (vendors user has favorited)
    IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[Favorites]'))
    BEGIN
        INSERT INTO #Activities (ActivityType, ActivityID, Title, Description, TargetID, TargetName, TargetURL, Rating, ImageURL, CreatedAt)
        SELECT TOP (@Limit)
            'favorite' as ActivityType,
            f.FavoriteID as ActivityID,
            'Favorited ' + vp.BusinessName as Title,
            vp.BusinessDescription as Description,
            f.VendorProfileID as TargetID,
            vp.BusinessName as TargetName,
            '/vendor/' + CAST(vp.VendorProfileID as NVARCHAR) as TargetURL,
            NULL as Rating,
            vp.LogoURL as ImageURL,
            f.CreatedAt
        FROM users.Favorites f
        JOIN vendors.VendorProfiles vp ON f.VendorProfileID = vp.VendorProfileID
        WHERE f.UserID = @UserID
        ORDER BY f.CreatedAt DESC;
    END
    
    -- Return all activities sorted by date, limited
    SELECT TOP (@Limit)
        ActivityType,
        ActivityID,
        Title,
        Description,
        TargetID,
        TargetName,
        TargetURL,
        Rating,
        ImageURL,
        CreatedAt
    FROM #Activities
    ORDER BY CreatedAt DESC;
    
    DROP TABLE #Activities;
END
GO
