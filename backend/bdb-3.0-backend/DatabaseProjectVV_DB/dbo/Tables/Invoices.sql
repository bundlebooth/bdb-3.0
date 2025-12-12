CREATE TABLE [dbo].[Invoices] (
    [InvoiceID]           INT             IDENTITY (1, 1) NOT NULL,
    [BookingID]           INT             NOT NULL,
    [UserID]              INT             NOT NULL,
    [VendorProfileID]     INT             NOT NULL,
    [InvoiceNumber]       NVARCHAR (50)   NOT NULL,
    [IssueDate]           DATETIME        DEFAULT (getdate()) NOT NULL,
    [DueDate]             DATETIME        NULL,
    [Status]              NVARCHAR (20)   DEFAULT ('issued') NOT NULL,
    [Currency]            NVARCHAR (3)    DEFAULT ('USD') NOT NULL,
    [Subtotal]            DECIMAL (10, 2) DEFAULT ((0)) NOT NULL,
    [VendorExpensesTotal] DECIMAL (10, 2) DEFAULT ((0)) NOT NULL,
    [PlatformFee]         DECIMAL (10, 2) DEFAULT ((0)) NOT NULL,
    [StripeFee]           DECIMAL (10, 2) DEFAULT ((0)) NOT NULL,
    [TaxAmount]           DECIMAL (10, 2) DEFAULT ((0)) NOT NULL,
    [TotalAmount]         DECIMAL (10, 2) DEFAULT ((0)) NOT NULL,
    [FeesIncludedInTotal] BIT             DEFAULT ((0)) NOT NULL,
    [SnapshotJSON]        NVARCHAR (MAX)  NULL,
    [CreatedAt]           DATETIME        DEFAULT (getdate()) NOT NULL,
    [UpdatedAt]           DATETIME        DEFAULT (getdate()) NOT NULL,
    [ServiceSubtotal]     DECIMAL (10, 2) NULL,
    [RenterProcessingFee] DECIMAL (10, 2) NULL,
    [PlatformCommission]  DECIMAL (10, 2) NULL,
    [VendorPayout]        DECIMAL (10, 2) NULL,
    [PaymentStatus]       NVARCHAR (50)   DEFAULT ('pending') NULL,
    [PaidAt]              DATETIME2 (7)   NULL,
    [StripeSessionId]     NVARCHAR (255)  NULL,
    PRIMARY KEY CLUSTERED ([InvoiceID] ASC),
    FOREIGN KEY ([BookingID]) REFERENCES [dbo].[Bookings] ([BookingID]) ON DELETE CASCADE,
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
);


GO

CREATE NONCLUSTERED INDEX [IX_Invoices_UserID]
    ON [dbo].[Invoices]([UserID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Invoices_BookingID]
    ON [dbo].[Invoices]([BookingID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Invoices_VendorProfileID]
    ON [dbo].[Invoices]([VendorProfileID] ASC);


GO

