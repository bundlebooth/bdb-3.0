CREATE TABLE [dbo].[Transactions] (
    [TransactionID]   INT             IDENTITY (1, 1) NOT NULL,
    [UserID]          INT             NULL,
    [VendorProfileID] INT             NULL,
    [BookingID]       INT             NULL,
    [Amount]          DECIMAL (10, 2) NOT NULL,
    [FeeAmount]       DECIMAL (10, 2) NULL,
    [NetAmount]       DECIMAL (10, 2) NULL,
    [Currency]        NVARCHAR (3)    DEFAULT ('USD') NULL,
    [Description]     NVARCHAR (255)  NULL,
    [StripeChargeID]  NVARCHAR (100)  NULL,
    [Status]          NVARCHAR (20)   NOT NULL,
    [CreatedAt]       DATETIME        DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([TransactionID] ASC),
    FOREIGN KEY ([BookingID]) REFERENCES [dbo].[Bookings] ([BookingID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
);


GO

