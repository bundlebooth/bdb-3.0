CREATE TABLE [dbo].[PaymentTransactions] (
    [TransactionID]         INT             IDENTITY (1, 1) NOT NULL,
    [BookingID]             INT             NULL,
    [UserID]                INT             NULL,
    [VendorProfileID]       INT             NULL,
    [GrossAmount]           DECIMAL (10, 2) NOT NULL,
    [PlatformFee]           DECIMAL (10, 2) NOT NULL,
    [ProcessingFee]         DECIMAL (10, 2) NOT NULL,
    [VendorPayout]          DECIMAL (10, 2) NOT NULL,
    [StripePaymentIntentID] NVARCHAR (255)  NULL,
    [StripeTransferID]      NVARCHAR (255)  NULL,
    [StripeChargeID]        NVARCHAR (255)  NULL,
    [Status]                NVARCHAR (50)   DEFAULT ('pending') NULL,
    [PayoutStatus]          NVARCHAR (50)   DEFAULT ('pending') NULL,
    [PayoutDate]            DATETIME2 (7)   NULL,
    [Currency]              NVARCHAR (10)   DEFAULT ('CAD') NULL,
    [Description]           NVARCHAR (500)  NULL,
    [CreatedAt]             DATETIME2 (7)   DEFAULT (getutcdate()) NULL,
    [UpdatedAt]             DATETIME2 (7)   DEFAULT (getutcdate()) NULL,
    PRIMARY KEY CLUSTERED ([TransactionID] ASC),
    FOREIGN KEY ([BookingID]) REFERENCES [dbo].[Bookings] ([BookingID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
);


GO

CREATE NONCLUSTERED INDEX [IX_PaymentTransactions_VendorProfileID]
    ON [dbo].[PaymentTransactions]([VendorProfileID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_PaymentTransactions_BookingID]
    ON [dbo].[PaymentTransactions]([BookingID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_PaymentTransactions_Status]
    ON [dbo].[PaymentTransactions]([Status] ASC);


GO

