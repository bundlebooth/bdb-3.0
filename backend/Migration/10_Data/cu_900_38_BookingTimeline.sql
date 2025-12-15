/*
    Migration Script: Data - [BookingTimeline]
    Phase: 900 - Data
    Script: cu_900_38_dbo.BookingTimeline.sql
    Description: Inserts data into [dbo].[BookingTimeline]
    
    Execution Order: 38
    Record Count: 1
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [dbo].[BookingTimeline]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [dbo].[BookingTimeline])
BEGIN
    SET IDENTITY_INSERT [dbo].[BookingTimeline] ON;

    INSERT [dbo].[BookingTimeline] ([TimelineID], [BookingID], [Status], [ChangedBy], [Notes], [CreatedAt]) VALUES (1, 1, N'pending', 3, N'Booking created by customer', CAST(N'2025-08-12T22:11:28.140' AS DateTime));

    SET IDENTITY_INSERT [dbo].[BookingTimeline] OFF;

    PRINT 'Inserted 1 records into [dbo].[BookingTimeline].';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[BookingTimeline] already contains data. Skipping.';
END
GO
