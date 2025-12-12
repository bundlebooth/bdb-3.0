CREATE TABLE [dbo].[PaymentMethods] (
    [PaymentMethodID]       INT            IDENTITY (1, 1) NOT NULL,
    [UserID]                INT            NULL,
    [StripePaymentMethodID] NVARCHAR (100) NOT NULL,
    [IsDefault]             BIT            DEFAULT ((0)) NULL,
    [CardBrand]             NVARCHAR (50)  NULL,
    [Last4]                 NVARCHAR (4)   NULL,
    [ExpMonth]              INT            NULL,
    [ExpYear]               INT            NULL,
    [CreatedAt]             DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([PaymentMethodID] ASC),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

