-- =============================================
-- Table: forum.ForumVotes
-- Description: Upvotes/downvotes on posts and comments
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[forum].[ForumVotes]') AND type in (N'U'))
BEGIN
    CREATE TABLE [forum].[ForumVotes](
        [VoteID] [int] IDENTITY(1,1) NOT NULL,
        [UserID] [int] NOT NULL,
        [PostID] [int] NULL,
        [CommentID] [int] NULL,
        [VoteType] [smallint] NOT NULL, -- 1 = upvote, -1 = downvote
        [CreatedAt] [datetime] DEFAULT GETDATE(),
        CONSTRAINT [PK_ForumVotes] PRIMARY KEY CLUSTERED ([VoteID] ASC),
        CONSTRAINT [FK_ForumVotes_User] FOREIGN KEY ([UserID]) REFERENCES [users].[Users]([UserID]),
        CONSTRAINT [FK_ForumVotes_Post] FOREIGN KEY ([PostID]) REFERENCES [forum].[ForumPosts]([PostID]),
        CONSTRAINT [FK_ForumVotes_Comment] FOREIGN KEY ([CommentID]) REFERENCES [forum].[ForumComments]([CommentID]),
        CONSTRAINT [CK_ForumVotes_VoteType] CHECK ([VoteType] IN (-1, 1)),
        CONSTRAINT [CK_ForumVotes_Target] CHECK (([PostID] IS NOT NULL AND [CommentID] IS NULL) OR ([PostID] IS NULL AND [CommentID] IS NOT NULL))
    );

    CREATE UNIQUE NONCLUSTERED INDEX [IX_ForumVotes_UserPost] ON [forum].[ForumVotes]([UserID], [PostID]) WHERE [PostID] IS NOT NULL;
    CREATE UNIQUE NONCLUSTERED INDEX [IX_ForumVotes_UserComment] ON [forum].[ForumVotes]([UserID], [CommentID]) WHERE [CommentID] IS NOT NULL;
END
GO
