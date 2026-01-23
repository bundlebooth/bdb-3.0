-- =============================================
-- Table: forum.ForumComments
-- Description: Comments on forum posts (supports nested replies)
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[forum].[ForumComments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [forum].[ForumComments](
        [CommentID] [int] IDENTITY(1,1) NOT NULL,
        [PostID] [int] NOT NULL,
        [ParentCommentID] [int] NULL,
        [AuthorID] [int] NOT NULL,
        [Content] [nvarchar](max) NOT NULL,
        [UpvoteCount] [int] DEFAULT 0,
        [DownvoteCount] [int] DEFAULT 0,
        [IsDeleted] [bit] DEFAULT 0,
        [CreatedAt] [datetime] DEFAULT GETDATE(),
        [UpdatedAt] [datetime] DEFAULT GETDATE(),
        CONSTRAINT [PK_ForumComments] PRIMARY KEY CLUSTERED ([CommentID] ASC),
        CONSTRAINT [FK_ForumComments_Post] FOREIGN KEY ([PostID]) REFERENCES [forum].[ForumPosts]([PostID]),
        CONSTRAINT [FK_ForumComments_Parent] FOREIGN KEY ([ParentCommentID]) REFERENCES [forum].[ForumComments]([CommentID]),
        CONSTRAINT [FK_ForumComments_Author] FOREIGN KEY ([AuthorID]) REFERENCES [users].[Users]([UserID])
    );

    CREATE NONCLUSTERED INDEX [IX_ForumComments_PostID] ON [forum].[ForumComments]([PostID]);
    CREATE NONCLUSTERED INDEX [IX_ForumComments_ParentCommentID] ON [forum].[ForumComments]([ParentCommentID]);
    CREATE NONCLUSTERED INDEX [IX_ForumComments_AuthorID] ON [forum].[ForumComments]([AuthorID]);
END
GO
