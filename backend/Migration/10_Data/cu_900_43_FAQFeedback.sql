/*
    Migration Script: Data - [FAQFeedback]
    Phase: 900 - Data
    Script: cu_900_43_dbo.FAQFeedback.sql
    Description: Inserts data into [dbo].[FAQFeedback]
    
    Execution Order: 43
    Record Count: 6
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [dbo].[FAQFeedback]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [dbo].[FAQFeedback])
BEGIN
    SET IDENTITY_INSERT [dbo].[FAQFeedback] ON;

    INSERT [dbo].[FAQFeedback] ([FeedbackID], [FAQID], [UserID], [Rating], [CreatedAt]) VALUES (1, 1, 144, N'helpful', CAST(N'2025-12-10T22:22:45.597' AS DateTime));
    INSERT [dbo].[FAQFeedback] ([FeedbackID], [FAQID], [UserID], [Rating], [CreatedAt]) VALUES (2, 2, 144, N'helpful', CAST(N'2025-12-10T22:22:55.750' AS DateTime));
    INSERT [dbo].[FAQFeedback] ([FeedbackID], [FAQID], [UserID], [Rating], [CreatedAt]) VALUES (3, 3, 144, N'neutral', CAST(N'2025-12-10T22:23:02.607' AS DateTime));
    INSERT [dbo].[FAQFeedback] ([FeedbackID], [FAQID], [UserID], [Rating], [CreatedAt]) VALUES (4, 4, 144, N'not_helpful', CAST(N'2025-12-10T22:23:06.133' AS DateTime));
    INSERT [dbo].[FAQFeedback] ([FeedbackID], [FAQID], [UserID], [Rating], [CreatedAt]) VALUES (5, 1, 1, N'helpful', CAST(N'2025-12-11T23:07:54.103' AS DateTime));
    INSERT [dbo].[FAQFeedback] ([FeedbackID], [FAQID], [UserID], [Rating], [CreatedAt]) VALUES (6, 1, 144, N'helpful', CAST(N'2025-12-12T01:22:41.773' AS DateTime));

    SET IDENTITY_INSERT [dbo].[FAQFeedback] OFF;

    PRINT 'Inserted 6 records into [dbo].[FAQFeedback].';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[FAQFeedback] already contains data. Skipping.';
END
GO
