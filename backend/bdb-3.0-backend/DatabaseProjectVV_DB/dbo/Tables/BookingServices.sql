CREATE TABLE [dbo].[BookingServices] (
    [BookingServiceID] INT             IDENTITY (1, 1) NOT NULL,
    [BookingID]        INT             NULL,
    [ServiceID]        INT             NULL,
    [AddOnID]          INT             NULL,
    [Quantity]         INT             DEFAULT ((1)) NULL,
    [PriceAtBooking]   DECIMAL (10, 2) NOT NULL,
    [Notes]            NVARCHAR (MAX)  NULL,
    PRIMARY KEY CLUSTERED ([BookingServiceID] ASC),
    FOREIGN KEY ([AddOnID]) REFERENCES [dbo].[ServiceAddOns] ([AddOnID]),
    FOREIGN KEY ([BookingID]) REFERENCES [dbo].[Bookings] ([BookingID]),
    FOREIGN KEY ([ServiceID]) REFERENCES [dbo].[Services] ([ServiceID])
);


GO

