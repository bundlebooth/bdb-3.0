CREATE TABLE [dbo].[PredefinedServices] (
    [PredefinedServiceID]    INT            IDENTITY (1, 1) NOT NULL,
    [Category]               NVARCHAR (50)  NOT NULL,
    [ServiceName]            NVARCHAR (100) NOT NULL,
    [ServiceDescription]     NVARCHAR (MAX) NULL,
    [DefaultDurationMinutes] INT            NULL,
    [IsActive]               BIT            DEFAULT ((1)) NULL,
    [DisplayOrder]           INT            DEFAULT ((0)) NULL,
    [CreatedAt]              DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]              DATETIME       DEFAULT (getdate()) NULL,
    [PricingModel]           NVARCHAR (20)  DEFAULT ('time_based') NOT NULL,
    PRIMARY KEY CLUSTERED ([PredefinedServiceID] ASC),
    CONSTRAINT [CK_PredefinedServices_PricingModel] CHECK ([PricingModel]='fixed_based' OR [PricingModel]='time_based'),
    CONSTRAINT [UC_CategoryService] UNIQUE NONCLUSTERED ([Category] ASC, [ServiceName] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_PredefinedServices_Category]
    ON [dbo].[PredefinedServices]([Category] ASC);


GO

