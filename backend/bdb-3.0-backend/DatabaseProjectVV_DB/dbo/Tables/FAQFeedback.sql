CREATE TABLE [dbo].[FAQFeedback] (
    [FeedbackID] INT           IDENTITY (1, 1) NOT NULL,
    [FAQID]      INT           NOT NULL,
    [UserID]     INT           NULL,
    [Rating]     NVARCHAR (20) NOT NULL,
    [CreatedAt]  DATETIME      DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([FeedbackID] ASC)
);


GO

