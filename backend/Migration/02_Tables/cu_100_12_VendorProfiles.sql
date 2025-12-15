/*
    Migration Script: Create Table [VendorProfiles]
    Phase: 100 - Tables
    Script: cu_100_12_dbo.VendorProfiles.sql
    Description: Creates the [dbo].[VendorProfiles] table
    
    Execution Order: 12
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[VendorProfiles]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[VendorProfiles]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[VendorProfiles](
	[VendorProfileID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NULL,
	[BusinessName] [nvarchar](100) NULL,
	[DisplayName] [nvarchar](100) NULL,
	[BusinessDescription] [nvarchar](max) NULL,
	[Tagline] [nvarchar](255) NULL,
	[BusinessPhone] [nvarchar](20) NULL,
	[BusinessEmail] [nvarchar](100) NULL,
	[Website] [nvarchar](255) NULL,
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
	[Capacity] [int] NULL,
	[Rooms] [int] NULL,
	[LogoURL] [nvarchar](255) NULL,
	[BookingLink] [nvarchar](255) NULL,
	[AcceptingBookings] [bit] NULL,
	[DepositRequirements] [nvarchar](max) NULL,
	[CancellationPolicy] [nvarchar](max) NULL,
	[ReschedulingPolicy] [nvarchar](max) NULL,
	[PaymentMethods] [nvarchar](max) NULL,
	[PaymentTerms] [nvarchar](max) NULL,
	[Awards] [nvarchar](max) NULL,
	[Certifications] [nvarchar](max) NULL,
	[ResponseTimeHours] [int] NULL,
	[BufferTimeMinutes] [int] NULL,
	[BusinessType] [nvarchar](50) NULL,
	[TaxID] [nvarchar](50) NULL,
	[SetupStep1Completed] [bit] NULL,
	[SetupStep2Completed] [bit] NULL,
	[SetupStep3Completed] [bit] NULL,
	[SetupStep4Completed] [bit] NULL,
	[SetupStep5Completed] [bit] NULL,
	[SetupStep6Completed] [bit] NULL,
	[SetupStep7Completed] [bit] NULL,
	[SetupStep8Completed] [bit] NULL,
	[SetupStep9Completed] [bit] NULL,
	[SetupStep10Completed] [bit] NULL,
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
	[GoogleBusinessUrl] [nvarchar](500) NULL,
	[TotalBookings] [int] NULL,
	[TotalReviews] [int] NULL,
	[AvgRating] [decimal](3, 2) NULL,
	[LastReviewDate] [datetime] NULL,
	[ProfileStatus] [nvarchar](50) NULL,
	[SubmittedForReviewAt] [datetime] NULL,
	[ReviewedAt] [datetime] NULL,
	[RejectionReason] [nvarchar](max) NULL,
	[AdminNotes] [nvarchar](max) NULL,
	[IsVisible] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[VendorProfileID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[VendorProfiles] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[VendorProfiles] already exists. Skipping.';
END
GO
