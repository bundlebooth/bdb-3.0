-- =============================================
-- Table: forum.ForumPosts
-- Description: Forum posts/threads
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[forum].[ForumPosts]') AND type in (N'U'))
BEGIN
    CREATE TABLE [forum].[ForumPosts](
        [PostID] [int] IDENTITY(1,1) NOT NULL,
        [CategoryID] [int] NOT NULL,
        [AuthorID] [int] NOT NULL,
        [Title] [nvarchar](300) NOT NULL,
        [Content] [nvarchar](max) NOT NULL,
        [Slug] [nvarchar](350) NOT NULL,
        [ImageURL] [nvarchar](500) NULL,
        [ViewCount] [int] DEFAULT 0,
        [CommentCount] [int] DEFAULT 0,
        [UpvoteCount] [int] DEFAULT 0,
        [DownvoteCount] [int] DEFAULT 0,
        [IsPinned] [bit] DEFAULT 0,
        [IsLocked] [bit] DEFAULT 0,
        [IsDeleted] [bit] DEFAULT 0,
        [CreatedAt] [datetime] DEFAULT GETDATE(),
        [UpdatedAt] [datetime] DEFAULT GETDATE(),
        CONSTRAINT [PK_ForumPosts] PRIMARY KEY CLUSTERED ([PostID] ASC),
        CONSTRAINT [FK_ForumPosts_Category] FOREIGN KEY ([CategoryID]) REFERENCES [forum].[ForumCategories]([CategoryID]),
        CONSTRAINT [FK_ForumPosts_Author] FOREIGN KEY ([AuthorID]) REFERENCES [users].[Users]([UserID])
    );

    CREATE NONCLUSTERED INDEX [IX_ForumPosts_CategoryID] ON [forum].[ForumPosts]([CategoryID]);
    CREATE NONCLUSTERED INDEX [IX_ForumPosts_AuthorID] ON [forum].[ForumPosts]([AuthorID]);
    CREATE NONCLUSTERED INDEX [IX_ForumPosts_CreatedAt] ON [forum].[ForumPosts]([CreatedAt] DESC);
    CREATE NONCLUSTERED INDEX [IX_ForumPosts_Slug] ON [forum].[ForumPosts]([Slug]);
END
GO
