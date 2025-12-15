/*
    Migration Script: Data - [BookingServices]
    Phase: 900 - Data
    Script: cu_900_37_dbo.BookingServices.sql
    Description: Inserts data into [dbo].[BookingServices]
    
    Execution Order: 37
    Record Count: 1
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [dbo].[BookingServices]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [dbo].[BookingServices])
BEGIN
    SET IDENTITY_INSERT [dbo].[BookingServices] ON;

    INSERT [dbo].[BookingServices] ([BookingServiceID], [BookingID], [ServiceID], [AddOnID], [Quantity], [PriceAtBooking], [Notes]) VALUES (1, 1, 1, NULL, 1, CAST(1500.00 AS Decimal(10, 2)), NULL);

    SET IDENTITY_INSERT [dbo].[BookingServices] OFF;

    PRINT 'Inserted 1 records into [dbo].[BookingServices].';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[BookingServices] already contains data. Skipping.';
END
GO
