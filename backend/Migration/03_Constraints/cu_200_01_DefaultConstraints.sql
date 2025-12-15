/*
    Migration Script: Default Constraints
    Phase: 200 - Constraints
    Script: cu_200_01_DefaultConstraints.sql
    Description: Adds all DEFAULT constraints to tables
    
    Execution Order: 1
*/

SET NOCOUNT ON;
GO

PRINT 'Adding DEFAULT constraints...';
GO
-- Default constraint 1 for [Users]
ALTER TABLE [dbo].[Users] ADD  DEFAULT ((0)) FOR [IsVendor]
GO

-- Default constraint 2 for [Users]
ALTER TABLE [dbo].[Users] ADD  DEFAULT ((0)) FOR [IsAdmin]
GO

-- Default constraint 3 for [Users]
ALTER TABLE [dbo].[Users] ADD  DEFAULT ((0)) FOR [EmailVerified]
GO

-- Default constraint 4 for [Users]
ALTER TABLE [dbo].[Users] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 5 for [Users]
ALTER TABLE [dbo].[Users] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO

-- Default constraint 6 for [Users]
ALTER TABLE [dbo].[Users] ADD  DEFAULT ('email') FOR [AuthProvider]
GO

-- Default constraint 7 for [Users]
ALTER TABLE [dbo].[Users] ADD  DEFAULT ('{"email":true,"push":true}') FOR [NotificationPreferences]
GO

-- Default constraint 8 for [Users]
ALTER TABLE [dbo].[Users] ADD  DEFAULT ((1)) FOR [IsActive]
GO

-- Default constraint 9 for [PlatformFAQs]
ALTER TABLE [dbo].[PlatformFAQs] ADD  DEFAULT ('general') FOR [Category]
GO

-- Default constraint 10 for [PlatformFAQs]
ALTER TABLE [dbo].[PlatformFAQs] ADD  DEFAULT ((0)) FOR [DisplayOrder]
GO

-- Default constraint 11 for [PlatformFAQs]
ALTER TABLE [dbo].[PlatformFAQs] ADD  DEFAULT ((1)) FOR [IsActive]
GO

-- Default constraint 12 for [PlatformFAQs]
ALTER TABLE [dbo].[PlatformFAQs] ADD  DEFAULT ((0)) FOR [ViewCount]
GO

-- Default constraint 13 for [PlatformFAQs]
ALTER TABLE [dbo].[PlatformFAQs] ADD  DEFAULT ((0)) FOR [HelpfulCount]
GO

-- Default constraint 14 for [PlatformFAQs]
ALTER TABLE [dbo].[PlatformFAQs] ADD  DEFAULT ((0)) FOR [NotHelpfulCount]
GO

-- Default constraint 15 for [PlatformFAQs]
ALTER TABLE [dbo].[PlatformFAQs] ADD  DEFAULT (getutcdate()) FOR [CreatedAt]
GO

-- Default constraint 16 for [PlatformFAQs]
ALTER TABLE [dbo].[PlatformFAQs] ADD  DEFAULT (getutcdate()) FOR [UpdatedAt]
GO

-- Default constraint 17 for [CommissionSettings]
ALTER TABLE [dbo].[CommissionSettings] ADD  DEFAULT ('percentage') FOR [SettingType]
GO

-- Default constraint 18 for [CommissionSettings]
ALTER TABLE [dbo].[CommissionSettings] ADD  DEFAULT ((1)) FOR [IsActive]
GO

-- Default constraint 19 for [CommissionSettings]
ALTER TABLE [dbo].[CommissionSettings] ADD  DEFAULT (getutcdate()) FOR [CreatedAt]
GO

-- Default constraint 20 for [CommissionSettings]
ALTER TABLE [dbo].[CommissionSettings] ADD  DEFAULT (getutcdate()) FOR [UpdatedAt]
GO

-- Default constraint 21 for [EmailTemplates]
ALTER TABLE [dbo].[EmailTemplates] ADD  DEFAULT ((1)) FOR [IsActive]
GO

-- Default constraint 22 for [EmailTemplates]
ALTER TABLE [dbo].[EmailTemplates] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 23 for [EmailTemplates]
ALTER TABLE [dbo].[EmailTemplates] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO

-- Default constraint 24 for [EmailTemplateComponents]
ALTER TABLE [dbo].[EmailTemplateComponents] ADD  DEFAULT ((1)) FOR [IsActive]
GO

-- Default constraint 25 for [EmailTemplateComponents]
ALTER TABLE [dbo].[EmailTemplateComponents] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 26 for [EmailTemplateComponents]
ALTER TABLE [dbo].[EmailTemplateComponents] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO

-- Default constraint 27 for [SecuritySettings]
ALTER TABLE [dbo].[SecuritySettings] ADD  DEFAULT ((1)) FOR [IsActive]
GO

-- Default constraint 28 for [SecuritySettings]
ALTER TABLE [dbo].[SecuritySettings] ADD  DEFAULT (getutcdate()) FOR [UpdatedAt]
GO

-- Default constraint 29 for [ContentBanners]
ALTER TABLE [dbo].[ContentBanners] ADD  DEFAULT ('hero') FOR [Position]
GO

-- Default constraint 30 for [ContentBanners]
ALTER TABLE [dbo].[ContentBanners] ADD  DEFAULT ((0)) FOR [DisplayOrder]
GO

-- Default constraint 31 for [ContentBanners]
ALTER TABLE [dbo].[ContentBanners] ADD  DEFAULT ((1)) FOR [IsActive]
GO

-- Default constraint 32 for [ContentBanners]
ALTER TABLE [dbo].[ContentBanners] ADD  DEFAULT (getutcdate()) FOR [CreatedAt]
GO

-- Default constraint 33 for [ContentBanners]
ALTER TABLE [dbo].[ContentBanners] ADD  DEFAULT (getutcdate()) FOR [UpdatedAt]
GO

-- Default constraint 34 for [Announcements]
ALTER TABLE [dbo].[Announcements] ADD  DEFAULT ('info') FOR [Type]
GO

-- Default constraint 35 for [Announcements]
ALTER TABLE [dbo].[Announcements] ADD  DEFAULT ('banner') FOR [DisplayType]
GO

-- Default constraint 36 for [Announcements]
ALTER TABLE [dbo].[Announcements] ADD  DEFAULT ('all') FOR [TargetAudience]
GO

-- Default constraint 37 for [Announcements]
ALTER TABLE [dbo].[Announcements] ADD  DEFAULT ((1)) FOR [IsActive]
GO

-- Default constraint 38 for [Announcements]
ALTER TABLE [dbo].[Announcements] ADD  DEFAULT ((1)) FOR [IsDismissible]
GO

-- Default constraint 39 for [Announcements]
ALTER TABLE [dbo].[Announcements] ADD  DEFAULT ((0)) FOR [DisplayOrder]
GO

-- Default constraint 40 for [Announcements]
ALTER TABLE [dbo].[Announcements] ADD  DEFAULT ((0)) FOR [ViewCount]
GO

-- Default constraint 41 for [Announcements]
ALTER TABLE [dbo].[Announcements] ADD  DEFAULT ((0)) FOR [DismissCount]
GO

-- Default constraint 42 for [Announcements]
ALTER TABLE [dbo].[Announcements] ADD  DEFAULT (getutcdate()) FOR [CreatedAt]
GO

-- Default constraint 43 for [Announcements]
ALTER TABLE [dbo].[Announcements] ADD  DEFAULT (getutcdate()) FOR [UpdatedAt]
GO

-- Default constraint 44 for [PredefinedServices]
ALTER TABLE [dbo].[PredefinedServices] ADD  DEFAULT ((1)) FOR [IsActive]
GO

-- Default constraint 45 for [PredefinedServices]
ALTER TABLE [dbo].[PredefinedServices] ADD  DEFAULT ((0)) FOR [DisplayOrder]
GO

-- Default constraint 46 for [PredefinedServices]
ALTER TABLE [dbo].[PredefinedServices] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 47 for [PredefinedServices]
ALTER TABLE [dbo].[PredefinedServices] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO

-- Default constraint 48 for [PredefinedServices]
ALTER TABLE [dbo].[PredefinedServices] ADD  DEFAULT ('time_based') FOR [PricingModel]
GO

-- Default constraint 49 for [VendorFeatureCategories]
ALTER TABLE [dbo].[VendorFeatureCategories] ADD  DEFAULT ((0)) FOR [DisplayOrder]
GO

-- Default constraint 50 for [VendorFeatureCategories]
ALTER TABLE [dbo].[VendorFeatureCategories] ADD  DEFAULT ((1)) FOR [IsActive]
GO

-- Default constraint 51 for [VendorFeatureCategories]
ALTER TABLE [dbo].[VendorFeatureCategories] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 52 for [VendorFeatures]
ALTER TABLE [dbo].[VendorFeatures] ADD  DEFAULT ((0)) FOR [DisplayOrder]
GO

-- Default constraint 53 for [VendorFeatures]
ALTER TABLE [dbo].[VendorFeatures] ADD  DEFAULT ((1)) FOR [IsActive]
GO

-- Default constraint 54 for [VendorFeatures]
ALTER TABLE [dbo].[VendorFeatures] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 55 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [InsuranceVerified]
GO

-- Default constraint 56 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [IsVerified]
GO

-- Default constraint 57 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [IsCompleted]
GO

-- Default constraint 58 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ('USA') FOR [Country]
GO

-- Default constraint 59 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [IsPremium]
GO

-- Default constraint 60 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [IsEcoFriendly]
GO

-- Default constraint 61 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [IsAwardWinning]
GO

-- Default constraint 62 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ('$$') FOR [PriceLevel]
GO

-- Default constraint 63 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [AcceptingBookings]
GO

-- Default constraint 64 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((24)) FOR [ResponseTimeHours]
GO

-- Default constraint 65 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((30)) FOR [BufferTimeMinutes]
GO

-- Default constraint 66 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [SetupStep1Completed]
GO

-- Default constraint 67 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [SetupStep2Completed]
GO

-- Default constraint 68 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [SetupStep3Completed]
GO

-- Default constraint 69 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [SetupStep4Completed]
GO

-- Default constraint 70 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [SetupStep5Completed]
GO

-- Default constraint 71 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [SetupStep6Completed]
GO

-- Default constraint 72 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [SetupStep7Completed]
GO

-- Default constraint 73 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [SetupStep8Completed]
GO

-- Default constraint 74 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [SetupStep9Completed]
GO

-- Default constraint 75 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [SetupStep10Completed]
GO

-- Default constraint 76 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 77 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO

-- Default constraint 78 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((1)) FOR [SetupStep]
GO

-- Default constraint 79 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [SetupCompleted]
GO

-- Default constraint 80 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [GalleryCompleted]
GO

-- Default constraint 81 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [PackagesCompleted]
GO

-- Default constraint 82 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [ServicesCompleted]
GO

-- Default constraint 83 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [SocialMediaCompleted]
GO

-- Default constraint 84 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [AvailabilityCompleted]
GO

-- Default constraint 85 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [IsLastMinute]
GO

-- Default constraint 86 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [IsCertified]
GO

-- Default constraint 87 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [IsInsured]
GO

-- Default constraint 88 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [IsLocal]
GO

-- Default constraint 89 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [IsMobile]
GO

-- Default constraint 90 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [TotalBookings]
GO

-- Default constraint 91 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [TotalReviews]
GO

-- Default constraint 92 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ('draft') FOR [ProfileStatus]
GO

-- Default constraint 93 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles] ADD  DEFAULT ((0)) FOR [IsVisible]
GO

-- Default constraint 94 for [UserSessions]
ALTER TABLE [dbo].[UserSessions] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 95 for [UserSessions]
ALTER TABLE [dbo].[UserSessions] ADD  DEFAULT ((1)) FOR [IsActive]
GO

-- Default constraint 96 for [UserLocations]
ALTER TABLE [dbo].[UserLocations] ADD  DEFAULT (getdate()) FOR [Timestamp]
GO

-- Default constraint 97 for [UserTwoFactorCodes]
ALTER TABLE [dbo].[UserTwoFactorCodes] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 98 for [UserTwoFactorCodes]
ALTER TABLE [dbo].[UserTwoFactorCodes] ADD  DEFAULT ((0)) FOR [Attempts]
GO

-- Default constraint 99 for [UserTwoFactorCodes]
ALTER TABLE [dbo].[UserTwoFactorCodes] ADD  DEFAULT ((0)) FOR [IsUsed]
GO

-- Default constraint 100 for [SecurityLogs]
ALTER TABLE [dbo].[SecurityLogs] ADD  DEFAULT ('Success') FOR [ActionStatus]
GO

-- Default constraint 101 for [SecurityLogs]
ALTER TABLE [dbo].[SecurityLogs] ADD  DEFAULT (getutcdate()) FOR [CreatedAt]
GO

-- Default constraint 102 for [SearchHistory]
ALTER TABLE [dbo].[SearchHistory] ADD  DEFAULT (getdate()) FOR [Timestamp]
GO

-- Default constraint 103 for [Notifications]
ALTER TABLE [dbo].[Notifications] ADD  DEFAULT ('general') FOR [Type]
GO

-- Default constraint 104 for [Notifications]
ALTER TABLE [dbo].[Notifications] ADD  DEFAULT ((0)) FOR [IsRead]
GO

-- Default constraint 105 for [Notifications]
ALTER TABLE [dbo].[Notifications] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 106 for [EmailLogs]
ALTER TABLE [dbo].[EmailLogs] ADD  DEFAULT ('sent') FOR [Status]
GO

-- Default constraint 107 for [EmailLogs]
ALTER TABLE [dbo].[EmailLogs] ADD  DEFAULT (getdate()) FOR [SentAt]
GO

-- Default constraint 108 for [SupportTickets]
ALTER TABLE [dbo].[SupportTickets] ADD  DEFAULT ('general') FOR [Category]
GO

-- Default constraint 109 for [SupportTickets]
ALTER TABLE [dbo].[SupportTickets] ADD  DEFAULT ('medium') FOR [Priority]
GO

-- Default constraint 110 for [SupportTickets]
ALTER TABLE [dbo].[SupportTickets] ADD  DEFAULT ('open') FOR [Status]
GO

-- Default constraint 111 for [SupportTickets]
ALTER TABLE [dbo].[SupportTickets] ADD  DEFAULT ('chat') FOR [Source]
GO

-- Default constraint 112 for [SupportTickets]
ALTER TABLE [dbo].[SupportTickets] ADD  DEFAULT (getutcdate()) FOR [CreatedAt]
GO

-- Default constraint 113 for [SupportTickets]
ALTER TABLE [dbo].[SupportTickets] ADD  DEFAULT (getutcdate()) FOR [UpdatedAt]
GO

-- Default constraint 114 for [VendorAdditionalDetails]
ALTER TABLE [dbo].[VendorAdditionalDetails] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 115 for [VendorAdditionalDetails]
ALTER TABLE [dbo].[VendorAdditionalDetails] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO

-- Default constraint 116 for [VendorBusinessHours]
ALTER TABLE [dbo].[VendorBusinessHours] ADD  DEFAULT ((1)) FOR [IsAvailable]
GO

-- Default constraint 117 for [VendorBusinessHours]
ALTER TABLE [dbo].[VendorBusinessHours] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 118 for [VendorBusinessHours]
ALTER TABLE [dbo].[VendorBusinessHours] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO

-- Default constraint 119 for [VendorBusinessHours]
ALTER TABLE [dbo].[VendorBusinessHours] ADD  DEFAULT ('America/New_York') FOR [Timezone]
GO

-- Default constraint 120 for [VendorAvailabilityExceptions]
ALTER TABLE [dbo].[VendorAvailabilityExceptions] ADD  DEFAULT ((0)) FOR [IsAvailable]
GO

-- Default constraint 121 for [VendorAvailabilityExceptions]
ALTER TABLE [dbo].[VendorAvailabilityExceptions] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 122 for [VendorAvailabilityExceptions]
ALTER TABLE [dbo].[VendorAvailabilityExceptions] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO

-- Default constraint 123 for [VendorImages]
ALTER TABLE [dbo].[VendorImages] ADD  DEFAULT ((0)) FOR [IsPrimary]
GO

-- Default constraint 124 for [VendorImages]
ALTER TABLE [dbo].[VendorImages] ADD  DEFAULT ((0)) FOR [DisplayOrder]
GO

-- Default constraint 125 for [VendorImages]
ALTER TABLE [dbo].[VendorImages] ADD  DEFAULT ('Gallery') FOR [ImageType]
GO

-- Default constraint 126 for [VendorImages]
ALTER TABLE [dbo].[VendorImages] ADD  DEFAULT (getutcdate()) FOR [CreatedAt]
GO

-- Default constraint 127 for [VendorPortfolio]
ALTER TABLE [dbo].[VendorPortfolio] ADD  DEFAULT ((0)) FOR [DisplayOrder]
GO

-- Default constraint 128 for [VendorPortfolio]
ALTER TABLE [dbo].[VendorPortfolio] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 129 for [VendorPortfolioAlbums]
ALTER TABLE [dbo].[VendorPortfolioAlbums] ADD  DEFAULT ((1)) FOR [IsPublic]
GO

-- Default constraint 130 for [VendorPortfolioAlbums]
ALTER TABLE [dbo].[VendorPortfolioAlbums] ADD  DEFAULT ((0)) FOR [DisplayOrder]
GO

-- Default constraint 131 for [VendorPortfolioAlbums]
ALTER TABLE [dbo].[VendorPortfolioAlbums] ADD  DEFAULT (getutcdate()) FOR [CreatedAt]
GO

-- Default constraint 132 for [VendorPortfolioAlbums]
ALTER TABLE [dbo].[VendorPortfolioAlbums] ADD  DEFAULT (getutcdate()) FOR [UpdatedAt]
GO

-- Default constraint 133 for [VendorFAQs]
ALTER TABLE [dbo].[VendorFAQs] ADD  DEFAULT ((0)) FOR [DisplayOrder]
GO

-- Default constraint 134 for [VendorFAQs]
ALTER TABLE [dbo].[VendorFAQs] ADD  DEFAULT ((1)) FOR [IsActive]
GO

-- Default constraint 135 for [VendorFAQs]
ALTER TABLE [dbo].[VendorFAQs] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 136 for [VendorFAQs]
ALTER TABLE [dbo].[VendorFAQs] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO

-- Default constraint 137 for [VendorFAQs]
ALTER TABLE [dbo].[VendorFAQs] ADD  DEFAULT ('text') FOR [AnswerType]
GO

-- Default constraint 138 for [VendorSocialMedia]
ALTER TABLE [dbo].[VendorSocialMedia] ADD  DEFAULT ((0)) FOR [DisplayOrder]
GO

-- Default constraint 139 for [VendorTeam]
ALTER TABLE [dbo].[VendorTeam] ADD  DEFAULT ((0)) FOR [DisplayOrder]
GO

-- Default constraint 140 for [VendorTeam]
ALTER TABLE [dbo].[VendorTeam] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 141 for [VendorTeam]
ALTER TABLE [dbo].[VendorTeam] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO

-- Default constraint 142 for [VendorServiceAreas]
ALTER TABLE [dbo].[VendorServiceAreas] ADD  DEFAULT ((25.0)) FOR [ServiceRadius]
GO

-- Default constraint 143 for [VendorServiceAreas]
ALTER TABLE [dbo].[VendorServiceAreas] ADD  DEFAULT ((1)) FOR [IsActive]
GO

-- Default constraint 144 for [VendorServiceAreas]
ALTER TABLE [dbo].[VendorServiceAreas] ADD  DEFAULT (getdate()) FOR [CreatedDate]
GO

-- Default constraint 145 for [VendorServiceAreas]
ALTER TABLE [dbo].[VendorServiceAreas] ADD  DEFAULT (getdate()) FOR [LastModifiedDate]
GO

-- Default constraint 146 for [VendorSelectedFeatures]
ALTER TABLE [dbo].[VendorSelectedFeatures] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 147 for [VendorProfileViews]
ALTER TABLE [dbo].[VendorProfileViews] ADD  DEFAULT (getutcdate()) FOR [ViewedAt]
GO

-- Default constraint 148 for [ServiceCategories]
ALTER TABLE [dbo].[ServiceCategories] ADD  DEFAULT ((0)) FOR [DisplayOrder]
GO

-- Default constraint 149 for [ServiceCategories]
ALTER TABLE [dbo].[ServiceCategories] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 150 for [ServiceCategories]
ALTER TABLE [dbo].[ServiceCategories] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO

-- Default constraint 151 for [Packages]
ALTER TABLE [dbo].[Packages] ADD  DEFAULT ((1)) FOR [IsActive]
GO

-- Default constraint 152 for [Packages]
ALTER TABLE [dbo].[Packages] ADD  DEFAULT ((0)) FOR [DisplayOrder]
GO

-- Default constraint 153 for [Packages]
ALTER TABLE [dbo].[Packages] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 154 for [Packages]
ALTER TABLE [dbo].[Packages] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO

-- Default constraint 155 for [Services]
ALTER TABLE [dbo].[Services] ADD  DEFAULT ((1)) FOR [IsActive]
GO

-- Default constraint 156 for [Services]
ALTER TABLE [dbo].[Services] ADD  DEFAULT ((1)) FOR [RequiresDeposit]
GO

-- Default constraint 157 for [Services]
ALTER TABLE [dbo].[Services] ADD  DEFAULT ((20.00)) FOR [DepositPercentage]
GO

-- Default constraint 158 for [Services]
ALTER TABLE [dbo].[Services] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 159 for [Services]
ALTER TABLE [dbo].[Services] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO

-- Default constraint 160 for [Services]
ALTER TABLE [dbo].[Services] ADD  DEFAULT ('Service') FOR [ServiceType]
GO

-- Default constraint 161 for [VendorSelectedServices]
ALTER TABLE [dbo].[VendorSelectedServices] ADD  DEFAULT ((1)) FOR [IsActive]
GO

-- Default constraint 162 for [VendorSelectedServices]
ALTER TABLE [dbo].[VendorSelectedServices] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 163 for [VendorSelectedServices]
ALTER TABLE [dbo].[VendorSelectedServices] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO

-- Default constraint 164 for [CategoryQuestions]
ALTER TABLE [dbo].[CategoryQuestions] ADD  DEFAULT ('YesNo') FOR [QuestionType]
GO

-- Default constraint 165 for [CategoryQuestions]
ALTER TABLE [dbo].[CategoryQuestions] ADD  DEFAULT ((1)) FOR [IsRequired]
GO

-- Default constraint 166 for [CategoryQuestions]
ALTER TABLE [dbo].[CategoryQuestions] ADD  DEFAULT ((0)) FOR [DisplayOrder]
GO

-- Default constraint 167 for [CategoryQuestions]
ALTER TABLE [dbo].[CategoryQuestions] ADD  DEFAULT ((1)) FOR [IsActive]
GO

-- Default constraint 168 for [CategoryQuestions]
ALTER TABLE [dbo].[CategoryQuestions] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 169 for [CategoryQuestions]
ALTER TABLE [dbo].[CategoryQuestions] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO

-- Default constraint 170 for [VendorCategoryAnswers]
ALTER TABLE [dbo].[VendorCategoryAnswers] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 171 for [VendorCategoryAnswers]
ALTER TABLE [dbo].[VendorCategoryAnswers] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO

-- Default constraint 172 for [ServiceImages]
ALTER TABLE [dbo].[ServiceImages] ADD  DEFAULT ((0)) FOR [IsPrimary]
GO

-- Default constraint 173 for [ServiceImages]
ALTER TABLE [dbo].[ServiceImages] ADD  DEFAULT ((0)) FOR [DisplayOrder]
GO

-- Default constraint 174 for [ServiceAddOns]
ALTER TABLE [dbo].[ServiceAddOns] ADD  DEFAULT ((1)) FOR [IsActive]
GO

-- Default constraint 175 for [ServiceAvailability]
ALTER TABLE [dbo].[ServiceAvailability] ADD  DEFAULT ((1)) FOR [IsAvailable]
GO

-- Default constraint 176 for [ServiceAvailability]
ALTER TABLE [dbo].[ServiceAvailability] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 177 for [TimeSlots]
ALTER TABLE [dbo].[TimeSlots] ADD  DEFAULT ((1)) FOR [IsAvailable]
GO

-- Default constraint 178 for [VendorPortfolioImages]
ALTER TABLE [dbo].[VendorPortfolioImages] ADD  DEFAULT ((0)) FOR [DisplayOrder]
GO

-- Default constraint 179 for [VendorPortfolioImages]
ALTER TABLE [dbo].[VendorPortfolioImages] ADD  DEFAULT (getutcdate()) FOR [CreatedAt]
GO

-- Default constraint 180 for [Favorites]
ALTER TABLE [dbo].[Favorites] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 181 for [Reviews]
ALTER TABLE [dbo].[Reviews] ADD  DEFAULT ((0)) FOR [IsAnonymous]
GO

-- Default constraint 182 for [Reviews]
ALTER TABLE [dbo].[Reviews] ADD  DEFAULT ((0)) FOR [IsFeatured]
GO

-- Default constraint 183 for [Reviews]
ALTER TABLE [dbo].[Reviews] ADD  DEFAULT ((0)) FOR [IsApproved]
GO

-- Default constraint 184 for [Reviews]
ALTER TABLE [dbo].[Reviews] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 185 for [Reviews]
ALTER TABLE [dbo].[Reviews] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO

-- Default constraint 186 for [Reviews]
ALTER TABLE [dbo].[Reviews] ADD  DEFAULT ((0)) FOR [IsFlagged]
GO

-- Default constraint 187 for [ReviewMedia]
ALTER TABLE [dbo].[ReviewMedia] ADD  DEFAULT ((0)) FOR [DisplayOrder]
GO

-- Default constraint 188 for [Conversations]
ALTER TABLE [dbo].[Conversations] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 189 for [Conversations]
ALTER TABLE [dbo].[Conversations] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO

-- Default constraint 190 for [SupportConversations]
ALTER TABLE [dbo].[SupportConversations] ADD  DEFAULT (getutcdate()) FOR [CreatedAt]
GO

-- Default constraint 191 for [SupportTicketMessages]
ALTER TABLE [dbo].[SupportTicketMessages] ADD  DEFAULT ((0)) FOR [IsInternal]
GO

-- Default constraint 192 for [SupportTicketMessages]
ALTER TABLE [dbo].[SupportTicketMessages] ADD  DEFAULT (getutcdate()) FOR [CreatedAt]
GO

-- Default constraint 193 for [Messages]
ALTER TABLE [dbo].[Messages] ADD  DEFAULT ((0)) FOR [IsRead]
GO

-- Default constraint 194 for [Messages]
ALTER TABLE [dbo].[Messages] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 195 for [Bookings]
ALTER TABLE [dbo].[Bookings] ADD  DEFAULT (getdate()) FOR [BookingDate]
GO

-- Default constraint 196 for [Bookings]
ALTER TABLE [dbo].[Bookings] ADD  DEFAULT ('pending') FOR [Status]
GO

-- Default constraint 197 for [Bookings]
ALTER TABLE [dbo].[Bookings] ADD  DEFAULT ((0)) FOR [DepositPaid]
GO

-- Default constraint 198 for [Bookings]
ALTER TABLE [dbo].[Bookings] ADD  DEFAULT ((0)) FOR [FullAmountPaid]
GO

-- Default constraint 199 for [Bookings]
ALTER TABLE [dbo].[Bookings] ADD  DEFAULT ((1)) FOR [AttendeeCount]
GO

-- Default constraint 200 for [Bookings]
ALTER TABLE [dbo].[Bookings] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 201 for [Bookings]
ALTER TABLE [dbo].[Bookings] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO

-- Default constraint 202 for [BookingRequests]
ALTER TABLE [dbo].[BookingRequests] ADD  DEFAULT ('pending') FOR [Status]
GO

-- Default constraint 203 for [BookingRequests]
ALTER TABLE [dbo].[BookingRequests] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 204 for [BookingRequests]
ALTER TABLE [dbo].[BookingRequests] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO

-- Default constraint 205 for [BookingServices]
ALTER TABLE [dbo].[BookingServices] ADD  DEFAULT ((1)) FOR [Quantity]
GO

-- Default constraint 206 for [BookingExpenses]
ALTER TABLE [dbo].[BookingExpenses] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 207 for [BookingTimeline]
ALTER TABLE [dbo].[BookingTimeline] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 208 for [Invoices]
ALTER TABLE [dbo].[Invoices] ADD  DEFAULT (getdate()) FOR [IssueDate]
GO

-- Default constraint 209 for [Invoices]
ALTER TABLE [dbo].[Invoices] ADD  DEFAULT ('issued') FOR [Status]
GO

-- Default constraint 210 for [Invoices]
ALTER TABLE [dbo].[Invoices] ADD  DEFAULT ('USD') FOR [Currency]
GO

-- Default constraint 211 for [Invoices]
ALTER TABLE [dbo].[Invoices] ADD  DEFAULT ((0)) FOR [Subtotal]
GO

-- Default constraint 212 for [Invoices]
ALTER TABLE [dbo].[Invoices] ADD  DEFAULT ((0)) FOR [VendorExpensesTotal]
GO

-- Default constraint 213 for [Invoices]
ALTER TABLE [dbo].[Invoices] ADD  DEFAULT ((0)) FOR [PlatformFee]
GO

-- Default constraint 214 for [Invoices]
ALTER TABLE [dbo].[Invoices] ADD  DEFAULT ((0)) FOR [StripeFee]
GO

-- Default constraint 215 for [Invoices]
ALTER TABLE [dbo].[Invoices] ADD  DEFAULT ((0)) FOR [TaxAmount]
GO

-- Default constraint 216 for [Invoices]
ALTER TABLE [dbo].[Invoices] ADD  DEFAULT ((0)) FOR [TotalAmount]
GO

-- Default constraint 217 for [Invoices]
ALTER TABLE [dbo].[Invoices] ADD  DEFAULT ((0)) FOR [FeesIncludedInTotal]
GO

-- Default constraint 218 for [Invoices]
ALTER TABLE [dbo].[Invoices] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 219 for [Invoices]
ALTER TABLE [dbo].[Invoices] ADD  DEFAULT (getdate()) FOR [UpdatedAt]
GO

-- Default constraint 220 for [Invoices]
ALTER TABLE [dbo].[Invoices] ADD  DEFAULT ('pending') FOR [PaymentStatus]
GO

-- Default constraint 221 for [InvoiceItems]
ALTER TABLE [dbo].[InvoiceItems] ADD  DEFAULT ((1)) FOR [Quantity]
GO

-- Default constraint 222 for [InvoiceItems]
ALTER TABLE [dbo].[InvoiceItems] ADD  DEFAULT ((0)) FOR [UnitPrice]
GO

-- Default constraint 223 for [InvoiceItems]
ALTER TABLE [dbo].[InvoiceItems] ADD  DEFAULT ((0)) FOR [Amount]
GO

-- Default constraint 224 for [InvoiceItems]
ALTER TABLE [dbo].[InvoiceItems] ADD  DEFAULT ((1)) FOR [IsPayable]
GO

-- Default constraint 225 for [InvoiceItems]
ALTER TABLE [dbo].[InvoiceItems] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 226 for [Transactions]
ALTER TABLE [dbo].[Transactions] ADD  DEFAULT ('USD') FOR [Currency]
GO

-- Default constraint 227 for [Transactions]
ALTER TABLE [dbo].[Transactions] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 228 for [PaymentMethods]
ALTER TABLE [dbo].[PaymentMethods] ADD  DEFAULT ((0)) FOR [IsDefault]
GO

-- Default constraint 229 for [PaymentMethods]
ALTER TABLE [dbo].[PaymentMethods] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

-- Default constraint 230 for [PaymentTransactions]
ALTER TABLE [dbo].[PaymentTransactions] ADD  DEFAULT ('pending') FOR [Status]
GO

-- Default constraint 231 for [PaymentTransactions]
ALTER TABLE [dbo].[PaymentTransactions] ADD  DEFAULT ('pending') FOR [PayoutStatus]
GO

-- Default constraint 232 for [PaymentTransactions]
ALTER TABLE [dbo].[PaymentTransactions] ADD  DEFAULT ('CAD') FOR [Currency]
GO

-- Default constraint 233 for [PaymentTransactions]
ALTER TABLE [dbo].[PaymentTransactions] ADD  DEFAULT (getutcdate()) FOR [CreatedAt]
GO

-- Default constraint 234 for [PaymentTransactions]
ALTER TABLE [dbo].[PaymentTransactions] ADD  DEFAULT (getutcdate()) FOR [UpdatedAt]
GO

-- Default constraint 235 for [FAQs]
ALTER TABLE [dbo].[FAQs] ADD  DEFAULT ('General') FOR [Category]
GO

-- Default constraint 236 for [FAQs]
ALTER TABLE [dbo].[FAQs] ADD  DEFAULT ((0)) FOR [DisplayOrder]
GO

-- Default constraint 237 for [FAQs]
ALTER TABLE [dbo].[FAQs] ADD  DEFAULT ((1)) FOR [IsActive]
GO

-- Default constraint 238 for [FAQs]
ALTER TABLE [dbo].[FAQs] ADD  DEFAULT (getutcdate()) FOR [CreatedAt]
GO

-- Default constraint 239 for [FAQs]
ALTER TABLE [dbo].[FAQs] ADD  DEFAULT (getutcdate()) FOR [UpdatedAt]
GO

-- Default constraint 240 for [FAQFeedback]
ALTER TABLE [dbo].[FAQFeedback] ADD  DEFAULT (getdate()) FOR [CreatedAt]
GO

PRINT 'DEFAULT constraints added successfully.';
GO

