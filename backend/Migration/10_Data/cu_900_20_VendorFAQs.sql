/*
    Migration Script: Data - [VendorFAQs]
    Phase: 900 - Data
    Script: cu_900_20_dbo.VendorFAQs.sql
    Description: Inserts data into [vendors].[VendorFAQs]
    
    Execution Order: 20
    Record Count: 14
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [vendors].[VendorFAQs]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [vendors].[VendorFAQs])
BEGIN
    SET IDENTITY_INSERT [vendors].[VendorFAQs] ON;

    INSERT [vendors].[VendorFAQs] ([FAQID], [VendorProfileID], [Question], [Answer], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt], [AnswerType], [AnswerOptions]) VALUES (1, 14, N'Testing Question 1 SAM', N'Testing ANser FAQ 1 SAM', 1, 1, CAST(N'2025-08-13T01:12:42.440' AS DateTime), CAST(N'2025-08-13T01:12:42.440' AS DateTime), N'text', NULL);
    INSERT [vendors].[VendorFAQs] ([FAQID], [VendorProfileID], [Question], [Answer], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt], [AnswerType], [AnswerOptions]) VALUES (2, 16, N'FAQ Question 1', N'FAQ Answer 1', 1, 1, CAST(N'2025-08-13T01:21:44.130' AS DateTime), CAST(N'2025-08-13T01:21:44.130' AS DateTime), N'text', NULL);
    INSERT [vendors].[VendorFAQs] ([FAQID], [VendorProfileID], [Question], [Answer], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt], [AnswerType], [AnswerOptions]) VALUES (3, 16, N'FAQ Question 1', N'FAQ Answer 1', 1, 1, CAST(N'2025-08-13T01:31:30.787' AS DateTime), CAST(N'2025-08-13T01:31:30.787' AS DateTime), N'text', NULL);
    INSERT [vendors].[VendorFAQs] ([FAQID], [VendorProfileID], [Question], [Answer], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt], [AnswerType], [AnswerOptions]) VALUES (4, 17, N'What type of events do you serve?', N'Our services are perfect for weddings, corporate events, birthdays, and more.', 1, 1, CAST(N'2025-08-13T16:41:30.330' AS DateTime), CAST(N'2025-08-13T16:41:30.330' AS DateTime), N'text', NULL);
    INSERT [vendors].[VendorFAQs] ([FAQID], [VendorProfileID], [Question], [Answer], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt], [AnswerType], [AnswerOptions]) VALUES (5, 17, N'What areas do you serve?', N'We serve Toronto and the GTA, including Mississauga, Vaughan, Brampton, Markham, Richmond Hill, and surrounding areas. If you''re just outside the GTA, send us a message — we might still be able to accommodate.', 2, 1, CAST(N'2025-08-13T16:41:30.363' AS DateTime), CAST(N'2025-08-13T16:41:30.363' AS DateTime), N'text', NULL);
    INSERT [vendors].[VendorFAQs] ([FAQID], [VendorProfileID], [Question], [Answer], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt], [AnswerType], [AnswerOptions]) VALUES (6, 17, N'How advance should i book?', N'We recommend booking 2–4 weeks in advance, especially for events during peak seasons (spring/summer and holidays). Last-minute inquiries are welcome and fulfilled based on availability.', 3, 1, CAST(N'2025-08-13T16:41:30.393' AS DateTime), CAST(N'2025-08-13T16:41:30.393' AS DateTime), N'text', NULL);
    INSERT [vendors].[VendorFAQs] ([FAQID], [VendorProfileID], [Question], [Answer], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt], [AnswerType], [AnswerOptions]) VALUES (7, 17, N'What type of events do you serve?', N'Our services are perfect for weddings, corporate events, birthdays, and more.', 1, 1, CAST(N'2025-08-13T16:41:42.320' AS DateTime), CAST(N'2025-08-13T16:41:42.320' AS DateTime), N'text', NULL);
    INSERT [vendors].[VendorFAQs] ([FAQID], [VendorProfileID], [Question], [Answer], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt], [AnswerType], [AnswerOptions]) VALUES (8, 17, N'What areas do you serve?', N'We serve Toronto and the GTA, including Mississauga, Vaughan, Brampton, Markham, Richmond Hill, and surrounding areas. If you''re just outside the GTA, send us a message — we might still be able to accommodate.', 2, 1, CAST(N'2025-08-13T16:41:42.353' AS DateTime), CAST(N'2025-08-13T16:41:42.353' AS DateTime), N'text', NULL);
    INSERT [vendors].[VendorFAQs] ([FAQID], [VendorProfileID], [Question], [Answer], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt], [AnswerType], [AnswerOptions]) VALUES (9, 17, N'How advance should i book?', N'We recommend booking 2–4 weeks in advance, especially for events during peak seasons (spring/summer and holidays). Last-minute inquiries are welcome and fulfilled based on availability.', 3, 1, CAST(N'2025-08-13T16:41:42.397' AS DateTime), CAST(N'2025-08-13T16:41:42.397' AS DateTime), N'text', NULL);
    INSERT [vendors].[VendorFAQs] ([FAQID], [VendorProfileID], [Question], [Answer], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt], [AnswerType], [AnswerOptions]) VALUES (11, 43, N'Blah', N'Balh ANswer', 1, 1, CAST(N'2025-08-14T16:32:17.987' AS DateTime), CAST(N'2025-08-14T16:32:17.987' AS DateTime), N'text', NULL);
    INSERT [vendors].[VendorFAQs] ([FAQID], [VendorProfileID], [Question], [Answer], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt], [AnswerType], [AnswerOptions]) VALUES (12, 43, N'Blah', N'Balh ANswer', 1, 1, CAST(N'2025-08-14T16:32:29.127' AS DateTime), CAST(N'2025-08-14T16:32:29.127' AS DateTime), N'text', NULL);
    INSERT [vendors].[VendorFAQs] ([FAQID], [VendorProfileID], [Question], [Answer], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt], [AnswerType], [AnswerOptions]) VALUES (15, 1, N'Test2222', N'Test222', 1, 1, CAST(N'2025-09-30T04:29:27.690' AS DateTime), CAST(N'2025-09-30T04:29:27.690' AS DateTime), N'text', NULL);
    INSERT [vendors].[VendorFAQs] ([FAQID], [VendorProfileID], [Question], [Answer], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt], [AnswerType], [AnswerOptions]) VALUES (16, 163, N'TeST', N'TEST', 1, 1, CAST(N'2025-10-05T18:45:24.170' AS DateTime), CAST(N'2025-10-05T18:45:24.170' AS DateTime), N'text', NULL);
    INSERT [vendors].[VendorFAQs] ([FAQID], [VendorProfileID], [Question], [Answer], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt], [AnswerType], [AnswerOptions]) VALUES (25, 138, N'What is the primary style you film with?', N'', 1, 1, CAST(N'2025-11-19T16:02:10.873' AS DateTime), CAST(N'2025-11-19T16:02:10.873' AS DateTime), N'multiple_choice', N'[{"label":"Cinematic","checked":true},{"label":"Short Form","checked":true},{"label":"Storytelling","checked":true},{"label":"Ans4","checked":true},{"label":"Anser 5","checked":true}]');

    SET IDENTITY_INSERT [vendors].[VendorFAQs] OFF;

    PRINT 'Inserted 14 records into [vendors].[VendorFAQs].';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[VendorFAQs] already contains data. Skipping.';
END
GO
