-- =============================================
-- Table: forum.ForumCategories
-- Description: Categories for organizing forum posts
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[forum].[ForumCategories]') AND type in (N'U'))
BEGIN
    CREATE TABLE [forum].[ForumCategories](
        [CategoryID] [int] IDENTITY(1,1) NOT NULL,
        [Name] [nvarchar](100) NOT NULL,
        [Description] [nvarchar](500) NULL,
        [Slug] [nvarchar](100) NOT NULL,
        [Icon] [nvarchar](50) NULL,
        [Color] [nvarchar](20) NULL,
        [SortOrder] [int] DEFAULT 0,
        [IsActive] [bit] DEFAULT 1,
        [CreatedAt] [datetime] DEFAULT GETDATE(),
        [UpdatedAt] [datetime] DEFAULT GETDATE(),
        CONSTRAINT [PK_ForumCategories] PRIMARY KEY CLUSTERED ([CategoryID] ASC),
        CONSTRAINT [UQ_ForumCategories_Slug] UNIQUE ([Slug])
    );
END
GO

-- Insert default categories
IF NOT EXISTS (SELECT 1 FROM [forum].[ForumCategories])
BEGIN
    INSERT INTO [forum].[ForumCategories] ([Name], [Description], [Slug], [Icon], [Color], [SortOrder])
    VALUES 
        ('General Discussion', 'General topics about weddings and events', 'general', 'fa-comments', '#6366f1', 1),
        ('Vendor Recommendations', 'Ask for and share vendor recommendations', 'vendor-recommendations', 'fa-star', '#f59e0b', 2),
        ('Planning Tips', 'Share and discover wedding planning tips', 'planning-tips', 'fa-lightbulb', '#10b981', 3),
        ('Budget & Finance', 'Discuss budgeting and financial planning', 'budget-finance', 'fa-dollar-sign', '#22c55e', 4),
        ('DIY & Crafts', 'Share DIY projects and craft ideas', 'diy-crafts', 'fa-scissors', '#ec4899', 5),
        ('Venue Talk', 'Discuss venues and locations', 'venue-talk', 'fa-building', '#8b5cf6', 6),
        ('Photography & Video', 'Tips on capturing your special day', 'photography-video', 'fa-camera', '#06b6d4', 7),
        ('Fashion & Beauty', 'Discuss attire, makeup, and styling', 'fashion-beauty', 'fa-gem', '#f43f5e', 8),
        ('Food & Catering', 'Menu ideas and catering discussions', 'food-catering', 'fa-utensils', '#f97316', 9),
        ('Success Stories', 'Share your wedding success stories', 'success-stories', 'fa-heart', '#ef4444', 10);
END
GO
