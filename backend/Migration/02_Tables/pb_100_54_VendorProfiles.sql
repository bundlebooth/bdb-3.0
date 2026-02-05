/*
    Migration Script: Create Table [VendorProfiles]
    Phase: 100 - Tables
    Script: cu_100_12_dbo.VendorProfiles.sql
    Description: Creates the [vendors].[VendorProfiles] table
    
    Execution Order: 12
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [vendors].[VendorProfiles]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[VendorProfiles](
	[VendorProfileID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NULL,
	[BusinessName] [nvarchar](100) NULL,
	[DisplayName] [nvarchar](100) NULL,
	[BusinessDescription] [nvarchar](max) NULL,
	[Tagline] [nvarchar](255) NULL,
	[BusinessPhone] [nvarchar](20) CONSTRAINT DF_VendorProfiles_BusinessPhone DEFAULT '' NULL,
	[BusinessEmail] [nvarchar](100) CONSTRAINT DF_VendorProfiles_BusinessEmail DEFAULT '' NULL,
	[Website] [nvarchar](255) CONSTRAINT DF_VendorProfiles_Website DEFAULT '' NULL,
	[YearsInBusiness] [int] NULL,
	[LicenseNumber] [nvarchar](50) NULL,
	[InsuranceVerified] [bit] NULL,
	[IsVerified] [bit] NULL,
	[IsCompleted] [bit] NULL,
	[StripeAccountID] [nvarchar](100) NULL,
	[AverageResponseTime] [int] NULL,
	[ResponseRate] [decimal](5, 2) NULL,
	[Address] [nvarchar](255) NULL,
	[City] [nvarchar](100) NULL,
	[State] [nvarchar](50) NULL,
	[Country] [nvarchar](50) NULL,
	[PostalCode] [nvarchar](20) NULL,
	[Latitude] [decimal](10, 8) NULL,
	[Longitude] [decimal](11, 8) NULL,
	[IsPremium] [bit] NULL,
	[IsEcoFriendly] [bit] NULL,
	[IsAwardWinning] [bit] NULL,
	[PriceLevel] [nvarchar](10) NULL,
	[LogoURL] [nvarchar](255) CONSTRAINT DF_VendorProfiles_LogoURL DEFAULT '' NULL,
	[AcceptingBookings] [bit] NULL,
	[CancellationPolicy] [nvarchar](max) NULL,
	[Awards] [nvarchar](max) NULL,
	[Certifications] [nvarchar](max) NULL,
	[ResponseTimeHours] [int] NULL,
	[BufferTimeMinutes] [int] NULL,
	[SetupStep4Completed] [bit] NULL,
	[SetupStep6Completed] [bit] NULL,
	[SetupStep7Completed] [bit] NULL,
	[SetupStep8Completed] [bit] NULL,
	[SetupStep9Completed] [bit] NULL,
	[SetupCompletedAt] [datetime] NULL,
	[CreatedAt] [datetime] NULL,
	[UpdatedAt] [datetime] NULL,
	[SetupStep] [int] NULL,
	[SetupCompleted] [bit] NULL,
	[GalleryCompleted] [bit] NULL,
	[PackagesCompleted] [bit] NULL,
	[ServicesCompleted] [bit] NULL,
	[SocialMediaCompleted] [bit] NULL,
	[AvailabilityCompleted] [bit] NULL,
	[IsLastMinute] [bit] NOT NULL,
	[IsCertified] [bit] NOT NULL,
	[IsInsured] [bit] NOT NULL,
	[IsLocal] [bit] NOT NULL,
	[IsMobile] [bit] NOT NULL,
	[GooglePlaceId] [nvarchar](100) NULL,
	[TotalBookings] [int] CONSTRAINT DF_VendorProfiles_TotalBookings DEFAULT 0 NULL,
	[TotalReviews] [int] CONSTRAINT DF_VendorProfiles_TotalReviews DEFAULT 0 NULL,
	[AvgRating] [decimal](3, 2) CONSTRAINT DF_VendorProfiles_AvgRating DEFAULT 0 NULL,
	[LastReviewDate] [datetime] NULL,
	[ProfileStatus] [nvarchar](50) NULL,
	[SubmittedForReviewAt] [datetime] NULL,
	[ReviewedAt] [datetime] NULL,
	[RejectionReason] [nvarchar](max) NULL,
	[IsVisible] [bit] NOT NULL,
	-- Booking Settings (added for vendor enhancements)
	[MinBookingHours] [int] NULL,
	[AdvanceNoticeHours] [int] NULL,
	[MaxCapacity] [int] NULL,
	[OffersHourlyRates] [bit] CONSTRAINT DF_VendorProfiles_OffersHourlyRates DEFAULT 0 NULL,
	[InstantBookingEnabled] [bit] CONSTRAINT DF_VendorProfiles_InstantBookingEnabled DEFAULT 0 NULL,
	[MinBookingLeadTimeHours] [int] CONSTRAINT DF_VendorProfiles_MinBookingLeadTimeHours DEFAULT 24 NULL,
	-- Service Attributes (added for vendor enhancements)
	[ServiceLocationScope] [nvarchar](50) NULL,
	[YearsOfExperienceRange] [nvarchar](20) NULL,
	[AffordabilityLevel] [nvarchar](20) NULL,
	[PriceType] [nvarchar](20) NULL,
	[BasePrice] [decimal](10, 2) NULL,
	-- Guest Favorite status (admin-controlled)
	[IsGuestFavorite] [bit] NOT NULL CONSTRAINT DF_VendorProfiles_IsGuestFavorite DEFAULT 0,
	[GuestFavoriteGrantedAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[VendorProfileID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [vendors].[VendorProfiles] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[VendorProfiles] already exists. Skipping.';
END
GO
