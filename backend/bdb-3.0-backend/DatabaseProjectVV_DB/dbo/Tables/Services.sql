CREATE TABLE [dbo].[Services] (
    [ServiceID]                 INT             IDENTITY (1, 1) NOT NULL,
    [CategoryID]                INT             NULL,
    [Name]                      NVARCHAR (100)  NOT NULL,
    [Description]               NVARCHAR (MAX)  NULL,
    [Price]                     DECIMAL (10, 2) NOT NULL,
    [DurationMinutes]           INT             NULL,
    [MinDuration]               INT             NULL,
    [MaxAttendees]              INT             NULL,
    [IsActive]                  BIT             DEFAULT ((1)) NULL,
    [RequiresDeposit]           BIT             DEFAULT ((1)) NULL,
    [DepositPercentage]         DECIMAL (5, 2)  DEFAULT ((20.00)) NULL,
    [CancellationPolicy]        NVARCHAR (MAX)  NULL,
    [CreatedAt]                 DATETIME        DEFAULT (getdate()) NULL,
    [UpdatedAt]                 DATETIME        DEFAULT (getdate()) NULL,
    [ServiceType]               NVARCHAR (20)   DEFAULT ('Service') NULL,
    [VendorProfileID]           INT             NULL,
    [LinkedPredefinedServiceID] INT             NULL,
    [BaseDurationMinutes]       INT             NULL,
    [BaseRate]                  DECIMAL (10, 2) NULL,
    [OvertimeRatePerHour]       DECIMAL (10, 2) NULL,
    [MinimumBookingFee]         DECIMAL (10, 2) NULL,
    [FixedPricingType]          NVARCHAR (20)   NULL,
    [FixedPrice]                DECIMAL (10, 2) NULL,
    [PricePerPerson]            DECIMAL (10, 2) NULL,
    [MinimumAttendees]          INT             NULL,
    [MaximumAttendees]          INT             NULL,
    [PricingModel]              NVARCHAR (20)   NULL,
    PRIMARY KEY CLUSTERED ([ServiceID] ASC),
    CONSTRAINT [CK_Services_FixedPricingType] CHECK ([FixedPricingType] IS NULL OR ([FixedPricingType]='per_attendee' OR [FixedPricingType]='fixed_price')),
    CONSTRAINT [CK_Services_PricingModel] CHECK ([PricingModel] IS NULL OR ([PricingModel]='fixed_based' OR [PricingModel]='time_based')),
    FOREIGN KEY ([CategoryID]) REFERENCES [dbo].[ServiceCategories] ([CategoryID]),
    CONSTRAINT [FK_Services_LinkedPredefinedService] FOREIGN KEY ([LinkedPredefinedServiceID]) REFERENCES [dbo].[PredefinedServices] ([PredefinedServiceID]) ON DELETE SET NULL,
    CONSTRAINT [FK_Services_VendorProfileID] FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
);


GO

CREATE NONCLUSTERED INDEX [IX_Services_LinkedPredefinedServiceID]
    ON [dbo].[Services]([LinkedPredefinedServiceID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Services_PricingModel]
    ON [dbo].[Services]([PricingModel] ASC);


GO

