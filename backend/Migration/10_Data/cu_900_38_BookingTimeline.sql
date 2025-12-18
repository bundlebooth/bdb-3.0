/*
    Migration Script: Data - [BookingTimeline]
    Phase: 900 - Data
    Script: cu_900_38_dbo.BookingTimeline.sql
    Description: Inserts data into [bookings].[BookingTimeline]
    
    Execution Order: 38
    Record Count: 1
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [bookings].[BookingTimeline]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [bookings].[BookingTimeline])
BEGIN
    SET IDENTITY_INSERT [bookings].[BookingTimeline] ON;

    INSERT [bookings].[BookingTimeline] ([TimelineID], [BookingID], [Status], [ChangedBy], [Notes], [CreatedAt]) VALUES (1, 1, N'pending', 3, N'Booking created by customer', CAST(N'2025-08-12T22:11:28.140' AS DateTime));

    SET IDENTITY_INSERT [bookings].[BookingTimeline] OFF;

    PRINT 'Inserted 1 records into [bookings].[BookingTimeline].';
END
ELSE
BEGIN
    PRINT 'Table [bookings].[BookingTimeline] already contains data. Skipping.';
END
GO
