CREATE TABLE [dbo].[InvoiceItems] (
    [InvoiceItemID] INT             IDENTITY (1, 1) NOT NULL,
    [InvoiceID]     INT             NOT NULL,
    [ItemType]      NVARCHAR (50)   NOT NULL,
    [RefID]         INT             NULL,
    [Title]         NVARCHAR (255)  NOT NULL,
    [Description]   NVARCHAR (MAX)  NULL,
    [Quantity]      DECIMAL (10, 2) DEFAULT ((1)) NOT NULL,
    [UnitPrice]     DECIMAL (10, 2) DEFAULT ((0)) NOT NULL,
    [Amount]        DECIMAL (10, 2) DEFAULT ((0)) NOT NULL,
    [IsPayable]     BIT             DEFAULT ((1)) NOT NULL,
    [CreatedAt]     DATETIME        DEFAULT (getdate()) NOT NULL,
    PRIMARY KEY CLUSTERED ([InvoiceItemID] ASC),
    FOREIGN KEY ([InvoiceID]) REFERENCES [dbo].[Invoices] ([InvoiceID]) ON DELETE CASCADE
);


GO

CREATE NONCLUSTERED INDEX [IX_InvoiceItems_InvoiceID]
    ON [dbo].[InvoiceItems]([InvoiceID] ASC);


GO

