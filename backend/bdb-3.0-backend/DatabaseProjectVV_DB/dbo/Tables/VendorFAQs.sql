CREATE TABLE [dbo].[VendorFAQs] (
    [FAQID]           INT            IDENTITY (1, 1) NOT NULL,
    [VendorProfileID] INT            NULL,
    [Question]        NVARCHAR (255) NOT NULL,
    [Answer]          NVARCHAR (MAX) NOT NULL,
    [DisplayOrder]    INT            DEFAULT ((0)) NULL,
    [IsActive]        BIT            DEFAULT ((1)) NULL,
    [CreatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    [AnswerType]      NVARCHAR (50)  DEFAULT ('text') NULL,
    [AnswerOptions]   NVARCHAR (MAX) NULL,
    PRIMARY KEY CLUSTERED ([FAQID] ASC),
    FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
);


GO

