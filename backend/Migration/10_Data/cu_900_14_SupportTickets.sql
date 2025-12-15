/*
    Migration Script: Data - [SupportTickets]
    Phase: 900 - Data
    Script: cu_900_14_dbo.SupportTickets.sql
    Description: Inserts data into [dbo].[SupportTickets]
    
    Execution Order: 14
    Record Count: 2
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [dbo].[SupportTickets]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [dbo].[SupportTickets])
BEGIN
    SET IDENTITY_INSERT [dbo].[SupportTickets] ON;

    INSERT [dbo].[SupportTickets] ([TicketID], [TicketNumber], [UserID], [UserEmail], [UserName], [Subject], [Description], [Category], [Priority], [Status], [AssignedTo], [Source], [ConversationID], [CreatedAt], [UpdatedAt], [ResolvedAt], [ClosedAt], [Attachments]) VALUES (1, N'TKT-20251210-9NDW', 1, N'samtest@sam.com', N'samtest', N'Supprot Ticket Test', N'Test', N'general', N'medium', N'open', NULL, N'chat', NULL, CAST(N'2025-12-10T18:01:50.5000000' AS DateTime2), CAST(N'2025-12-10T18:01:50.5000000' AS DateTime2), NULL, NULL, NULL);
    INSERT [dbo].[SupportTickets] ([TicketID], [TicketNumber], [UserID], [UserEmail], [UserName], [Subject], [Description], [Category], [Priority], [Status], [AssignedTo], [Source], [ConversationID], [CreatedAt], [UpdatedAt], [ResolvedAt], [ClosedAt], [Attachments]) VALUES (2, N'TKT-20251210-R0VQ', 1, N'samtest@sam.com', N'samtest', N'Test', N'test', N'general', N'medium', N'open', NULL, N'chat', NULL, CAST(N'2025-12-10T19:36:23.4300000' AS DateTime2), CAST(N'2025-12-10T19:36:23.4300000' AS DateTime2), NULL, NULL, NULL);

    SET IDENTITY_INSERT [dbo].[SupportTickets] OFF;

    PRINT 'Inserted 2 records into [dbo].[SupportTickets].';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[SupportTickets] already contains data. Skipping.';
END
GO
