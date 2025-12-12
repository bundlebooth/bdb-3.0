CREATE TABLE [dbo].[Bookings] (
    [BookingID]             INT             IDENTITY (1, 1) NOT NULL,
    [UserID]                INT             NULL,
    [VendorProfileID]       INT             NULL,
    [ServiceID]             INT             NULL,
    [BookingDate]           DATETIME        DEFAULT (getdate()) NULL,
    [EventDate]             DATETIME        NOT NULL,
    [EndDate]               DATETIME        NULL,
    [Status]                NVARCHAR (20)   DEFAULT ('pending') NULL,
    [TotalAmount]           DECIMAL (10, 2) NULL,
    [DepositAmount]         DECIMAL (10, 2) NULL,
    [DepositPaid]           BIT             DEFAULT ((0)) NULL,
    [FullAmountPaid]        BIT             DEFAULT ((0)) NULL,
    [AttendeeCount]         INT             DEFAULT ((1)) NULL,
    [SpecialRequests]       NVARCHAR (MAX)  NULL,
    [CancellationDate]      DATETIME        NULL,
    [RefundAmount]          DECIMAL (10, 2) NULL,
    [StripePaymentIntentID] NVARCHAR (100)  NULL,
    [CreatedAt]             DATETIME        DEFAULT (getdate()) NULL,
    [UpdatedAt]             DATETIME        DEFAULT (getdate()) NULL,
    [EventLocation]         NVARCHAR (500)  NULL,
    [EventName]             NVARCHAR (255)  NULL,
    [EventType]             NVARCHAR (100)  NULL,
    [TimeZone]              NVARCHAR (100)  NULL,
    [StripeSessionID]       NVARCHAR (255)  NULL,
    PRIMARY KEY CLUSTERED ([BookingID] ASC),
    FOREIGN KEY ([ServiceID]) REFERENCES [dbo].[Services] ([ServiceID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
);


GO


CREATE TRIGGER tr_Bookings_UpdateCount
ON Bookings
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vp
    SET TotalBookings = (
        SELECT COUNT(*)
        FROM Bookings
        WHERE VendorProfileID = vp.VendorProfileID
          AND Status IN ('confirmed', 'completed')
    )
    FROM VendorProfiles vp
    WHERE vp.VendorProfileID IN (
        SELECT DISTINCT VendorProfileID FROM inserted
        UNION
        SELECT DISTINCT VendorProfileID FROM deleted
    );
END

GO

