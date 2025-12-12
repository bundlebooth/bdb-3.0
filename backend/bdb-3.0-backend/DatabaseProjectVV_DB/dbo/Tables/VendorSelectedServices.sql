CREATE TABLE [dbo].[VendorSelectedServices] (
    [VendorSelectedServiceID] INT             IDENTITY (1, 1) NOT NULL,
    [VendorProfileID]         INT             NULL,
    [PredefinedServiceID]     INT             NULL,
    [VendorPrice]             DECIMAL (10, 2) NOT NULL,
    [VendorDurationMinutes]   INT             NULL,
    [VendorDescription]       NVARCHAR (MAX)  NULL,
    [IsActive]                BIT             DEFAULT ((1)) NULL,
    [CreatedAt]               DATETIME        DEFAULT (getdate()) NULL,
    [UpdatedAt]               DATETIME        DEFAULT (getdate()) NULL,
    [ImageURL]                NVARCHAR (500)  NULL,
    PRIMARY KEY CLUSTERED ([VendorSelectedServiceID] ASC),
    FOREIGN KEY ([PredefinedServiceID]) REFERENCES [dbo].[PredefinedServices] ([PredefinedServiceID]),
    FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID]),
    CONSTRAINT [UC_VendorService] UNIQUE NONCLUSTERED ([VendorProfileID] ASC, [PredefinedServiceID] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_VendorSelectedServices_VendorProfileID]
    ON [dbo].[VendorSelectedServices]([VendorProfileID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_VendorSelectedServices_ImageURL]
    ON [dbo].[VendorSelectedServices]([ImageURL] ASC) WHERE ([ImageURL] IS NOT NULL);


GO

CREATE NONCLUSTERED INDEX [IX_VendorSelectedServices_PredefinedServiceID]
    ON [dbo].[VendorSelectedServices]([PredefinedServiceID] ASC);


GO

