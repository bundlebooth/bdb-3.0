CREATE TABLE [dbo].[VendorProfiles] (
    [VendorProfileID]       INT             IDENTITY (1, 1) NOT NULL,
    [UserID]                INT             NULL,
    [BusinessName]          NVARCHAR (100)  NULL,
    [DisplayName]           NVARCHAR (100)  NULL,
    [BusinessDescription]   NVARCHAR (MAX)  NULL,
    [Tagline]               NVARCHAR (255)  NULL,
    [BusinessPhone]         NVARCHAR (20)   NULL,
    [BusinessEmail]         NVARCHAR (100)  NULL,
    [Website]               NVARCHAR (255)  NULL,
    [YearsInBusiness]       INT             NULL,
    [LicenseNumber]         NVARCHAR (50)   NULL,
    [InsuranceVerified]     BIT             DEFAULT ((0)) NULL,
    [IsVerified]            BIT             DEFAULT ((0)) NULL,
    [IsCompleted]           BIT             DEFAULT ((0)) NULL,
    [StripeAccountID]       NVARCHAR (100)  NULL,
    [AverageResponseTime]   INT             NULL,
    [ResponseRate]          DECIMAL (5, 2)  NULL,
    [Address]               NVARCHAR (255)  NULL,
    [City]                  NVARCHAR (100)  NULL,
    [State]                 NVARCHAR (50)   NULL,
    [Country]               NVARCHAR (50)   DEFAULT ('USA') NULL,
    [PostalCode]            NVARCHAR (20)   NULL,
    [Latitude]              DECIMAL (10, 8) NULL,
    [Longitude]             DECIMAL (11, 8) NULL,
    [IsPremium]             BIT             DEFAULT ((0)) NULL,
    [IsEcoFriendly]         BIT             DEFAULT ((0)) NULL,
    [IsAwardWinning]        BIT             DEFAULT ((0)) NULL,
    [PriceLevel]            NVARCHAR (10)   DEFAULT ('$$') NULL,
    [Capacity]              INT             NULL,
    [Rooms]                 INT             NULL,
    [LogoURL]               NVARCHAR (255)  NULL,
    [BookingLink]           NVARCHAR (255)  NULL,
    [AcceptingBookings]     BIT             DEFAULT ((0)) NULL,
    [DepositRequirements]   NVARCHAR (MAX)  NULL,
    [CancellationPolicy]    NVARCHAR (MAX)  NULL,
    [ReschedulingPolicy]    NVARCHAR (MAX)  NULL,
    [PaymentMethods]        NVARCHAR (MAX)  NULL,
    [PaymentTerms]          NVARCHAR (MAX)  NULL,
    [Awards]                NVARCHAR (MAX)  NULL,
    [Certifications]        NVARCHAR (MAX)  NULL,
    [ResponseTimeHours]     INT             DEFAULT ((24)) NULL,
    [BufferTimeMinutes]     INT             DEFAULT ((30)) NULL,
    [BusinessType]          NVARCHAR (50)   NULL,
    [TaxID]                 NVARCHAR (50)   NULL,
    [SetupStep1Completed]   BIT             DEFAULT ((0)) NULL,
    [SetupStep2Completed]   BIT             DEFAULT ((0)) NULL,
    [SetupStep3Completed]   BIT             DEFAULT ((0)) NULL,
    [SetupStep4Completed]   BIT             DEFAULT ((0)) NULL,
    [SetupStep5Completed]   BIT             DEFAULT ((0)) NULL,
    [SetupStep6Completed]   BIT             DEFAULT ((0)) NULL,
    [SetupStep7Completed]   BIT             DEFAULT ((0)) NULL,
    [SetupStep8Completed]   BIT             DEFAULT ((0)) NULL,
    [SetupStep9Completed]   BIT             DEFAULT ((0)) NULL,
    [SetupStep10Completed]  BIT             DEFAULT ((0)) NULL,
    [SetupCompletedAt]      DATETIME        NULL,
    [CreatedAt]             DATETIME        DEFAULT (getdate()) NULL,
    [UpdatedAt]             DATETIME        DEFAULT (getdate()) NULL,
    [SetupStep]             INT             DEFAULT ((1)) NULL,
    [SetupCompleted]        BIT             DEFAULT ((0)) NULL,
    [GalleryCompleted]      BIT             DEFAULT ((0)) NULL,
    [PackagesCompleted]     BIT             DEFAULT ((0)) NULL,
    [ServicesCompleted]     BIT             DEFAULT ((0)) NULL,
    [SocialMediaCompleted]  BIT             DEFAULT ((0)) NULL,
    [AvailabilityCompleted] BIT             DEFAULT ((0)) NULL,
    [IsLastMinute]          BIT             DEFAULT ((0)) NOT NULL,
    [IsCertified]           BIT             DEFAULT ((0)) NOT NULL,
    [IsInsured]             BIT             DEFAULT ((0)) NOT NULL,
    [IsLocal]               BIT             DEFAULT ((0)) NOT NULL,
    [IsMobile]              BIT             DEFAULT ((0)) NOT NULL,
    [GooglePlaceId]         NVARCHAR (100)  NULL,
    [GoogleBusinessUrl]     NVARCHAR (500)  NULL,
    [TotalBookings]         INT             DEFAULT ((0)) NULL,
    [TotalReviews]          INT             DEFAULT ((0)) NULL,
    [AvgRating]             DECIMAL (3, 2)  NULL,
    [LastReviewDate]        DATETIME        NULL,
    [ProfileStatus]         NVARCHAR (50)   DEFAULT ('draft') NULL,
    [SubmittedForReviewAt]  DATETIME        NULL,
    [ReviewedAt]            DATETIME        NULL,
    [RejectionReason]       NVARCHAR (MAX)  NULL,
    [AdminNotes]            NVARCHAR (MAX)  NULL,
    [IsVisible]             BIT             DEFAULT ((0)) NOT NULL,
    PRIMARY KEY CLUSTERED ([VendorProfileID] ASC),
    CONSTRAINT [CK_VendorProfiles_PriceLevel] CHECK ([PriceLevel]='$$$$' OR [PriceLevel]='$$$' OR [PriceLevel]='$$' OR [PriceLevel]='$'),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    UNIQUE NONCLUSTERED ([UserID] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_VendorProfiles_IsVisible]
    ON [dbo].[VendorProfiles]([IsVisible] ASC) WHERE ([IsVisible]=(1));


GO

CREATE NONCLUSTERED INDEX [IX_VendorProfiles_ProfileStatus]
    ON [dbo].[VendorProfiles]([ProfileStatus] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_VendorProfiles_PopularFilters]
    ON [dbo].[VendorProfiles]([IsPremium] ASC, [IsEcoFriendly] ASC, [IsAwardWinning] ASC, [IsLastMinute] ASC)
    INCLUDE([VendorProfileID], [BusinessName]);


GO

CREATE NONCLUSTERED INDEX [IX_VendorProfiles_GooglePlaceId]
    ON [dbo].[VendorProfiles]([GooglePlaceId] ASC) WHERE ([GooglePlaceId] IS NOT NULL);


GO

CREATE NONCLUSTERED INDEX [IX_VendorProfiles_LastReviewDate]
    ON [dbo].[VendorProfiles]([LastReviewDate] DESC)
    INCLUDE([City], [IsVisible]) WHERE ([IsVisible]=(1) AND [LastReviewDate] IS NOT NULL);


GO

CREATE NONCLUSTERED INDEX [IX_VendorProfiles_AvgRating]
    ON [dbo].[VendorProfiles]([AvgRating] DESC, [TotalReviews] DESC)
    INCLUDE([City], [IsVisible]) WHERE ([IsVisible]=(1) AND [AvgRating]>=(4.5));


GO

CREATE NONCLUSTERED INDEX [IX_VendorProfiles_TotalBookings]
    ON [dbo].[VendorProfiles]([TotalBookings] DESC)
    INCLUDE([City], [IsVisible]) WHERE ([IsVisible]=(1));


GO

CREATE NONCLUSTERED INDEX [IX_VendorProfiles_IsPremium]
    ON [dbo].[VendorProfiles]([IsPremium] ASC)
    INCLUDE([City], [IsCompleted], [TotalBookings], [AvgRating]) WHERE ([IsCompleted]=(1) AND [IsPremium]=(1));


GO

CREATE NONCLUSTERED INDEX [IX_VendorProfiles_CreatedAt]
    ON [dbo].[VendorProfiles]([CreatedAt] DESC)
    INCLUDE([City], [IsCompleted]) WHERE ([IsCompleted]=(1));


GO

