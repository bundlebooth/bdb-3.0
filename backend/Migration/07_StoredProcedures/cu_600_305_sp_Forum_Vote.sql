-- =============================================
-- Stored Procedure: forum.sp_Vote
-- Description: Upvote or downvote a post or comment
-- =============================================

CREATE OR ALTER PROCEDURE [forum].[sp_Vote]
    @UserID INT,
    @PostID INT = NULL,
    @CommentID INT = NULL,
    @VoteType SMALLINT -- 1 = upvote, -1 = downvote, 0 = remove vote
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate input
    IF (@PostID IS NULL AND @CommentID IS NULL) OR (@PostID IS NOT NULL AND @CommentID IS NOT NULL)
    BEGIN
        RAISERROR('Must specify either PostID or CommentID, not both or neither', 16, 1);
        RETURN;
    END
    
    DECLARE @ExistingVote SMALLINT;
    DECLARE @VoteID INT;
    
    -- Check for existing vote
    IF @PostID IS NOT NULL
    BEGIN
        SELECT @VoteID = VoteID, @ExistingVote = VoteType 
        FROM [forum].[ForumVotes] 
        WHERE UserID = @UserID AND PostID = @PostID;
    END
    ELSE
    BEGIN
        SELECT @VoteID = VoteID, @ExistingVote = VoteType 
        FROM [forum].[ForumVotes] 
        WHERE UserID = @UserID AND CommentID = @CommentID;
    END
    
    -- Handle vote removal
    IF @VoteType = 0
    BEGIN
        IF @VoteID IS NOT NULL
        BEGIN
            DELETE FROM [forum].[ForumVotes] WHERE VoteID = @VoteID;
            
            -- Update counts
            IF @PostID IS NOT NULL
            BEGIN
                IF @ExistingVote = 1
                    UPDATE [forum].[ForumPosts] SET UpvoteCount = UpvoteCount - 1 WHERE PostID = @PostID;
                ELSE
                    UPDATE [forum].[ForumPosts] SET DownvoteCount = DownvoteCount - 1 WHERE PostID = @PostID;
            END
            ELSE
            BEGIN
                IF @ExistingVote = 1
                    UPDATE [forum].[ForumComments] SET UpvoteCount = UpvoteCount - 1 WHERE CommentID = @CommentID;
                ELSE
                    UPDATE [forum].[ForumComments] SET DownvoteCount = DownvoteCount - 1 WHERE CommentID = @CommentID;
            END
        END
    END
    ELSE
    BEGIN
        -- Insert or update vote
        IF @VoteID IS NULL
        BEGIN
            -- New vote
            INSERT INTO [forum].[ForumVotes] (UserID, PostID, CommentID, VoteType)
            VALUES (@UserID, @PostID, @CommentID, @VoteType);
            
            -- Update counts
            IF @PostID IS NOT NULL
            BEGIN
                IF @VoteType = 1
                    UPDATE [forum].[ForumPosts] SET UpvoteCount = UpvoteCount + 1 WHERE PostID = @PostID;
                ELSE
                    UPDATE [forum].[ForumPosts] SET DownvoteCount = DownvoteCount + 1 WHERE PostID = @PostID;
            END
            ELSE
            BEGIN
                IF @VoteType = 1
                    UPDATE [forum].[ForumComments] SET UpvoteCount = UpvoteCount + 1 WHERE CommentID = @CommentID;
                ELSE
                    UPDATE [forum].[ForumComments] SET DownvoteCount = DownvoteCount + 1 WHERE CommentID = @CommentID;
            END
        END
        ELSE IF @ExistingVote != @VoteType
        BEGIN
            -- Change vote
            UPDATE [forum].[ForumVotes] SET VoteType = @VoteType, CreatedAt = GETDATE() WHERE VoteID = @VoteID;
            
            -- Update counts (remove old, add new)
            IF @PostID IS NOT NULL
            BEGIN
                IF @VoteType = 1
                    UPDATE [forum].[ForumPosts] SET UpvoteCount = UpvoteCount + 1, DownvoteCount = DownvoteCount - 1 WHERE PostID = @PostID;
                ELSE
                    UPDATE [forum].[ForumPosts] SET UpvoteCount = UpvoteCount - 1, DownvoteCount = DownvoteCount + 1 WHERE PostID = @PostID;
            END
            ELSE
            BEGIN
                IF @VoteType = 1
                    UPDATE [forum].[ForumComments] SET UpvoteCount = UpvoteCount + 1, DownvoteCount = DownvoteCount - 1 WHERE CommentID = @CommentID;
                ELSE
                    UPDATE [forum].[ForumComments] SET UpvoteCount = UpvoteCount - 1, DownvoteCount = DownvoteCount + 1 WHERE CommentID = @CommentID;
            END
        END
    END
    
    -- Return updated counts
    IF @PostID IS NOT NULL
    BEGIN
        SELECT UpvoteCount, DownvoteCount, (UpvoteCount - DownvoteCount) AS Score
        FROM [forum].[ForumPosts] WHERE PostID = @PostID;
    END
    ELSE
    BEGIN
        SELECT UpvoteCount, DownvoteCount, (UpvoteCount - DownvoteCount) AS Score
        FROM [forum].[ForumComments] WHERE CommentID = @CommentID;
    END
END
GO
