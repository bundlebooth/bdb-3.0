CREATE TABLE [dbo].[PlatformFAQs] (
    [FAQID]           INT            IDENTITY (1, 1) NOT NULL,
    [Question]        NVARCHAR (500) NOT NULL,
    [Answer]          NVARCHAR (MAX) NOT NULL,
    [Category]        NVARCHAR (50)  DEFAULT ('general') NULL,
    [DisplayOrder]    INT            DEFAULT ((0)) NULL,
    [IsActive]        BIT            DEFAULT ((1)) NULL,
    [ViewCount]       INT            DEFAULT ((0)) NULL,
    [HelpfulCount]    INT            DEFAULT ((0)) NULL,
    [NotHelpfulCount] INT            DEFAULT ((0)) NULL,
    [CreatedAt]       DATETIME2 (7)  DEFAULT (getutcdate()) NULL,
    [UpdatedAt]       DATETIME2 (7)  DEFAULT (getutcdate()) NULL,
    PRIMARY KEY CLUSTERED ([FAQID] ASC)
);


GO

