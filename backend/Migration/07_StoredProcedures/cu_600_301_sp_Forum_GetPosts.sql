-- =============================================
-- Stored Procedure: forum.sp_GetPosts
-- Description: Get forum posts with filtering and pagination
-- =============================================

CREATE OR ALTER PROCEDURE [forum].[sp_GetPosts]
    @CategorySlug NVARCHAR(100) = NULL,
    @SearchQuery NVARCHAR(200) = NULL,
    @SortBy NVARCHAR(20) = 'newest', -- 'newest', 'top', 'hot', 'controversial'
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @UserID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    -- Get total count
    SELECT COUNT(*) AS TotalCount
    FROM [forum].[ForumPosts] p
    JOIN [forum].[ForumCategories] c ON p.CategoryID = c.CategoryID
    WHERE p.IsDeleted = 0
        AND (@CategorySlug IS NULL OR c.Slug = @CategorySlug)
        AND (@SearchQuery IS NULL OR p.Title LIKE '%' + @SearchQuery + '%' OR p.Content LIKE '%' + @SearchQuery + '%');
    
    -- Get posts
    SELECT 
        p.PostID,
        p.CategoryID,
        c.Name AS CategoryName,
        c.Slug AS CategorySlug,
        c.Icon AS CategoryIcon,
        c.Color AS CategoryColor,
        p.AuthorID,
        u.Name AS AuthorName,
        u.ProfileImageURL AS AuthorAvatar,
        p.Title,
        p.Content,
        p.Slug,
        p.ImageURL,
        p.ViewCount,
        p.CommentCount,
        p.UpvoteCount,
        p.DownvoteCount,
        (p.UpvoteCount - p.DownvoteCount) AS Score,
        p.IsPinned,
        p.IsLocked,
        p.CreatedAt,
        p.UpdatedAt,
        CASE WHEN @UserID IS NOT NULL THEN 
            (SELECT VoteType FROM [forum].[ForumVotes] v WHERE v.UserID = @UserID AND v.PostID = p.PostID)
        ELSE NULL END AS UserVote
    FROM [forum].[ForumPosts] p
    JOIN [forum].[ForumCategories] c ON p.CategoryID = c.CategoryID
    JOIN [users].[Users] u ON p.AuthorID = u.UserID
    WHERE p.IsDeleted = 0
        AND (@CategorySlug IS NULL OR c.Slug = @CategorySlug)
        AND (@SearchQuery IS NULL OR p.Title LIKE '%' + @SearchQuery + '%' OR p.Content LIKE '%' + @SearchQuery + '%')
    ORDER BY 
        p.IsPinned DESC,
        CASE @SortBy 
            WHEN 'newest' THEN p.CreatedAt
            WHEN 'top' THEN NULL
            WHEN 'hot' THEN NULL
            WHEN 'controversial' THEN NULL
        END DESC,
        CASE @SortBy 
            WHEN 'top' THEN (p.UpvoteCount - p.DownvoteCount)
            WHEN 'hot' THEN (p.UpvoteCount - p.DownvoteCount) * 1.0 / (DATEDIFF(HOUR, p.CreatedAt, GETDATE()) + 2)
            WHEN 'controversial' THEN (p.UpvoteCount + p.DownvoteCount)
        END DESC,
        p.CreatedAt DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO
