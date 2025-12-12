CREATE TABLE [dbo].[BookingExpenses] (
    [BookingExpenseID] INT             IDENTITY (1, 1) NOT NULL,
    [BookingID]        INT             NOT NULL,
    [VendorProfileID]  INT             NULL,
    [Title]            NVARCHAR (255)  NOT NULL,
    [Amount]           DECIMAL (10, 2) NOT NULL,
    [Notes]            NVARCHAR (MAX)  NULL,
    [CreatedAt]        DATETIME        DEFAULT (getdate()) NOT NULL,
    PRIMARY KEY CLUSTERED ([BookingExpenseID] ASC),
    FOREIGN KEY ([BookingID]) REFERENCES [dbo].[Bookings] ([BookingID]) ON DELETE CASCADE,
    FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
);


GO

CREATE NONCLUSTERED INDEX [IX_BookingExpenses_BookingID]
    ON [dbo].[BookingExpenses]([BookingID] ASC);


GO

