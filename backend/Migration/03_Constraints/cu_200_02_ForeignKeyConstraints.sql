/*
    Migration Script: Foreign Key Constraints
    Phase: 200 - Constraints
    Script: cu_200_02_ForeignKeyConstraints.sql
    Description: Adds all FOREIGN KEY constraints to tables
    
    Execution Order: 2
*/

SET NOCOUNT ON;
GO

PRINT 'Adding FOREIGN KEY constraints...';
GO
-- FK constraint 1 for [EmailTemplates]
ALTER TABLE [dbo].[EmailTemplates]  WITH CHECK ADD FOREIGN KEY([BodyComponentID])
REFERENCES [dbo].[EmailTemplateComponents] ([ComponentID])
GO

-- FK constraint 2 for [EmailTemplates]
ALTER TABLE [dbo].[EmailTemplates]  WITH CHECK ADD FOREIGN KEY([FooterComponentID])
REFERENCES [dbo].[EmailTemplateComponents] ([ComponentID])
GO

-- FK constraint 3 for [EmailTemplates]
ALTER TABLE [dbo].[EmailTemplates]  WITH CHECK ADD FOREIGN KEY([HeaderComponentID])
REFERENCES [dbo].[EmailTemplateComponents] ([ComponentID])
GO

-- FK constraint 4 for [ContentBanners]
ALTER TABLE [dbo].[ContentBanners]  WITH CHECK ADD FOREIGN KEY([CreatedBy])
REFERENCES [dbo].[Users] ([UserID])
GO

-- FK constraint 5 for [Announcements]
ALTER TABLE [dbo].[Announcements]  WITH CHECK ADD FOREIGN KEY([CreatedBy])
REFERENCES [dbo].[Users] ([UserID])
GO

-- FK constraint 6 for [VendorFeatures]
ALTER TABLE [dbo].[VendorFeatures]  WITH CHECK ADD FOREIGN KEY([CategoryID])
REFERENCES [dbo].[VendorFeatureCategories] ([CategoryID])
GO

-- FK constraint 7 for [VendorProfiles]
ALTER TABLE [dbo].[VendorProfiles]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [dbo].[Users] ([UserID])
GO

-- FK constraint 8 for [UserSessions]
ALTER TABLE [dbo].[UserSessions]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [dbo].[Users] ([UserID])
GO

-- FK constraint 9 for [UserLocations]
ALTER TABLE [dbo].[UserLocations]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [dbo].[Users] ([UserID])
GO

-- FK constraint 10 for [SecurityLogs]
ALTER TABLE [dbo].[SecurityLogs]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [dbo].[Users] ([UserID])
GO

-- FK constraint 11 for [SearchHistory]
ALTER TABLE [dbo].[SearchHistory]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [dbo].[Users] ([UserID])
GO

-- FK constraint 12 for [Notifications]
ALTER TABLE [dbo].[Notifications]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [dbo].[Users] ([UserID])
GO

-- FK constraint 13 for [EmailLogs]
ALTER TABLE [dbo].[EmailLogs]  WITH CHECK ADD FOREIGN KEY([BookingID])
REFERENCES [dbo].[Bookings] ([BookingID])
GO

-- FK constraint 14 for [EmailLogs]
ALTER TABLE [dbo].[EmailLogs]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [dbo].[Users] ([UserID])
GO

-- FK constraint 15 for [SupportTickets]
ALTER TABLE [dbo].[SupportTickets]  WITH CHECK ADD FOREIGN KEY([AssignedTo])
REFERENCES [dbo].[Users] ([UserID])
GO

-- FK constraint 16 for [SupportTickets]
ALTER TABLE [dbo].[SupportTickets]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [dbo].[Users] ([UserID])
GO

-- FK constraint 17 for [VendorCategories]
ALTER TABLE [dbo].[VendorCategories]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 18 for [VendorAdditionalDetails]
ALTER TABLE [dbo].[VendorAdditionalDetails]  WITH CHECK ADD FOREIGN KEY([QuestionID])
REFERENCES [dbo].[CategoryQuestions] ([QuestionID])
ON DELETE CASCADE
GO

-- FK constraint 19 for [VendorAdditionalDetails]
ALTER TABLE [dbo].[VendorAdditionalDetails]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
ON DELETE CASCADE
GO

-- FK constraint 20 for [VendorBusinessHours]
ALTER TABLE [dbo].[VendorBusinessHours]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 21 for [VendorAvailabilityExceptions]
ALTER TABLE [dbo].[VendorAvailabilityExceptions]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 22 for [VendorImages]
ALTER TABLE [dbo].[VendorImages]  WITH CHECK ADD  CONSTRAINT [FK_VendorImages_VendorProfiles] FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 23 for [VendorPortfolio]
ALTER TABLE [dbo].[VendorPortfolio]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 24 for [VendorPortfolioAlbums]
ALTER TABLE [dbo].[VendorPortfolioAlbums]  WITH CHECK ADD  CONSTRAINT [FK_VendorPortfolioAlbums_VendorProfiles] FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 25 for [VendorFAQs]
ALTER TABLE [dbo].[VendorFAQs]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 26 for [VendorSocialMedia]
ALTER TABLE [dbo].[VendorSocialMedia]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 27 for [VendorTeam]
ALTER TABLE [dbo].[VendorTeam]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 28 for [VendorServiceAreas]
ALTER TABLE [dbo].[VendorServiceAreas]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 29 for [VendorSelectedFeatures]
ALTER TABLE [dbo].[VendorSelectedFeatures]  WITH CHECK ADD FOREIGN KEY([FeatureID])
REFERENCES [dbo].[VendorFeatures] ([FeatureID])
GO

-- FK constraint 30 for [VendorSelectedFeatures]
ALTER TABLE [dbo].[VendorSelectedFeatures]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
ON DELETE CASCADE
GO

-- FK constraint 31 for [VendorProfileViews]
ALTER TABLE [dbo].[VendorProfileViews]  WITH CHECK ADD  CONSTRAINT [FK_VendorProfileViews_User] FOREIGN KEY([ViewerUserID])
REFERENCES [dbo].[Users] ([UserID])
ON DELETE SET NULL
GO

-- FK constraint 32 for [VendorProfileViews]
ALTER TABLE [dbo].[VendorProfileViews]  WITH CHECK ADD  CONSTRAINT [FK_VendorProfileViews_VendorProfile] FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
ON DELETE CASCADE
GO

-- FK constraint 33 for [ServiceCategories]
ALTER TABLE [dbo].[ServiceCategories]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 34 for [Packages]
ALTER TABLE [dbo].[Packages]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 35 for [Services]
ALTER TABLE [dbo].[Services]  WITH CHECK ADD FOREIGN KEY([CategoryID])
REFERENCES [dbo].[ServiceCategories] ([CategoryID])
GO

-- FK constraint 36 for [Services]
ALTER TABLE [dbo].[Services]  WITH CHECK ADD  CONSTRAINT [FK_Services_LinkedPredefinedService] FOREIGN KEY([LinkedPredefinedServiceID])
REFERENCES [dbo].[PredefinedServices] ([PredefinedServiceID])
ON DELETE SET NULL
GO

-- FK constraint 37 for [Services]
ALTER TABLE [dbo].[Services]  WITH CHECK ADD  CONSTRAINT [FK_Services_VendorProfileID] FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 38 for [VendorSelectedServices]
ALTER TABLE [dbo].[VendorSelectedServices]  WITH CHECK ADD FOREIGN KEY([PredefinedServiceID])
REFERENCES [dbo].[PredefinedServices] ([PredefinedServiceID])
GO

-- FK constraint 39 for [VendorSelectedServices]
ALTER TABLE [dbo].[VendorSelectedServices]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 40 for [VendorCategoryAnswers]
ALTER TABLE [dbo].[VendorCategoryAnswers]  WITH CHECK ADD FOREIGN KEY([QuestionID])
REFERENCES [dbo].[CategoryQuestions] ([QuestionID])
GO

-- FK constraint 41 for [VendorCategoryAnswers]
ALTER TABLE [dbo].[VendorCategoryAnswers]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 42 for [ServiceImages]
ALTER TABLE [dbo].[ServiceImages]  WITH CHECK ADD FOREIGN KEY([ServiceID])
REFERENCES [dbo].[Services] ([ServiceID])
GO

-- FK constraint 43 for [ServiceAddOns]
ALTER TABLE [dbo].[ServiceAddOns]  WITH CHECK ADD FOREIGN KEY([ServiceID])
REFERENCES [dbo].[Services] ([ServiceID])
GO

-- FK constraint 44 for [ServiceAvailability]
ALTER TABLE [dbo].[ServiceAvailability]  WITH CHECK ADD FOREIGN KEY([ServiceID])
REFERENCES [dbo].[Services] ([ServiceID])
GO

-- FK constraint 45 for [TimeSlots]
ALTER TABLE [dbo].[TimeSlots]  WITH CHECK ADD FOREIGN KEY([ServiceID])
REFERENCES [dbo].[Services] ([ServiceID])
GO

-- FK constraint 46 for [TimeSlots]
ALTER TABLE [dbo].[TimeSlots]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 47 for [VendorPortfolioImages]
ALTER TABLE [dbo].[VendorPortfolioImages]  WITH CHECK ADD  CONSTRAINT [FK_VendorPortfolioImages_Albums] FOREIGN KEY([AlbumID])
REFERENCES [dbo].[VendorPortfolioAlbums] ([AlbumID])
ON DELETE CASCADE
GO

-- FK constraint 48 for [VendorPortfolioImages]
ALTER TABLE [dbo].[VendorPortfolioImages]  WITH CHECK ADD  CONSTRAINT [FK_VendorPortfolioImages_VendorProfiles] FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 49 for [Favorites]
ALTER TABLE [dbo].[Favorites]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [dbo].[Users] ([UserID])
GO

-- FK constraint 50 for [Favorites]
ALTER TABLE [dbo].[Favorites]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 51 for [Reviews]
ALTER TABLE [dbo].[Reviews]  WITH CHECK ADD FOREIGN KEY([BookingID])
REFERENCES [dbo].[Bookings] ([BookingID])
GO

-- FK constraint 52 for [Reviews]
ALTER TABLE [dbo].[Reviews]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [dbo].[Users] ([UserID])
GO

-- FK constraint 53 for [Reviews]
ALTER TABLE [dbo].[Reviews]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 54 for [ReviewMedia]
ALTER TABLE [dbo].[ReviewMedia]  WITH CHECK ADD FOREIGN KEY([ReviewID])
REFERENCES [dbo].[Reviews] ([ReviewID])
GO

-- FK constraint 55 for [Conversations]
ALTER TABLE [dbo].[Conversations]  WITH CHECK ADD FOREIGN KEY([BookingID])
REFERENCES [dbo].[Bookings] ([BookingID])
GO

-- FK constraint 56 for [Conversations]
ALTER TABLE [dbo].[Conversations]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [dbo].[Users] ([UserID])
GO

-- FK constraint 57 for [Conversations]
ALTER TABLE [dbo].[Conversations]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 58 for [SupportConversations]
ALTER TABLE [dbo].[SupportConversations]  WITH CHECK ADD FOREIGN KEY([ConversationID])
REFERENCES [dbo].[Conversations] ([ConversationID])
GO

-- FK constraint 59 for [SupportConversations]
ALTER TABLE [dbo].[SupportConversations]  WITH CHECK ADD FOREIGN KEY([TicketID])
REFERENCES [dbo].[SupportTickets] ([TicketID])
GO

-- FK constraint 60 for [SupportTicketMessages]
ALTER TABLE [dbo].[SupportTicketMessages]  WITH CHECK ADD FOREIGN KEY([SenderID])
REFERENCES [dbo].[Users] ([UserID])
GO

-- FK constraint 61 for [SupportTicketMessages]
ALTER TABLE [dbo].[SupportTicketMessages]  WITH CHECK ADD FOREIGN KEY([TicketID])
REFERENCES [dbo].[SupportTickets] ([TicketID])
GO

-- FK constraint 62 for [Messages]
ALTER TABLE [dbo].[Messages]  WITH CHECK ADD FOREIGN KEY([ConversationID])
REFERENCES [dbo].[Conversations] ([ConversationID])
GO

-- FK constraint 63 for [Messages]
ALTER TABLE [dbo].[Messages]  WITH CHECK ADD FOREIGN KEY([SenderID])
REFERENCES [dbo].[Users] ([UserID])
GO

-- FK constraint 64 for [MessageAttachments]
ALTER TABLE [dbo].[MessageAttachments]  WITH CHECK ADD FOREIGN KEY([MessageID])
REFERENCES [dbo].[Messages] ([MessageID])
GO

-- FK constraint 65 for [Bookings]
ALTER TABLE [dbo].[Bookings]  WITH CHECK ADD FOREIGN KEY([ServiceID])
REFERENCES [dbo].[Services] ([ServiceID])
GO

-- FK constraint 66 for [Bookings]
ALTER TABLE [dbo].[Bookings]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [dbo].[Users] ([UserID])
GO

-- FK constraint 67 for [Bookings]
ALTER TABLE [dbo].[Bookings]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 68 for [BookingRequests]
ALTER TABLE [dbo].[BookingRequests]  WITH CHECK ADD FOREIGN KEY([ServiceID])
REFERENCES [dbo].[Services] ([ServiceID])
GO

-- FK constraint 69 for [BookingRequests]
ALTER TABLE [dbo].[BookingRequests]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [dbo].[Users] ([UserID])
GO

-- FK constraint 70 for [BookingRequests]
ALTER TABLE [dbo].[BookingRequests]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 71 for [BookingServices]
ALTER TABLE [dbo].[BookingServices]  WITH CHECK ADD FOREIGN KEY([AddOnID])
REFERENCES [dbo].[ServiceAddOns] ([AddOnID])
GO

-- FK constraint 72 for [BookingServices]
ALTER TABLE [dbo].[BookingServices]  WITH CHECK ADD FOREIGN KEY([BookingID])
REFERENCES [dbo].[Bookings] ([BookingID])
GO

-- FK constraint 73 for [BookingServices]
ALTER TABLE [dbo].[BookingServices]  WITH CHECK ADD FOREIGN KEY([ServiceID])
REFERENCES [dbo].[Services] ([ServiceID])
GO

-- FK constraint 74 for [BookingExpenses]
ALTER TABLE [dbo].[BookingExpenses]  WITH CHECK ADD FOREIGN KEY([BookingID])
REFERENCES [dbo].[Bookings] ([BookingID])
ON DELETE CASCADE
GO

-- FK constraint 75 for [BookingExpenses]
ALTER TABLE [dbo].[BookingExpenses]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 76 for [BookingTimeline]
ALTER TABLE [dbo].[BookingTimeline]  WITH CHECK ADD FOREIGN KEY([BookingID])
REFERENCES [dbo].[Bookings] ([BookingID])
GO

-- FK constraint 77 for [BookingTimeline]
ALTER TABLE [dbo].[BookingTimeline]  WITH CHECK ADD FOREIGN KEY([ChangedBy])
REFERENCES [dbo].[Users] ([UserID])
GO

-- FK constraint 78 for [Invoices]
ALTER TABLE [dbo].[Invoices]  WITH CHECK ADD FOREIGN KEY([BookingID])
REFERENCES [dbo].[Bookings] ([BookingID])
ON DELETE CASCADE
GO

-- FK constraint 79 for [Invoices]
ALTER TABLE [dbo].[Invoices]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [dbo].[Users] ([UserID])
GO

-- FK constraint 80 for [Invoices]
ALTER TABLE [dbo].[Invoices]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 81 for [InvoiceItems]
ALTER TABLE [dbo].[InvoiceItems]  WITH CHECK ADD FOREIGN KEY([InvoiceID])
REFERENCES [dbo].[Invoices] ([InvoiceID])
ON DELETE CASCADE
GO

-- FK constraint 82 for [Transactions]
ALTER TABLE [dbo].[Transactions]  WITH CHECK ADD FOREIGN KEY([BookingID])
REFERENCES [dbo].[Bookings] ([BookingID])
GO

-- FK constraint 83 for [Transactions]
ALTER TABLE [dbo].[Transactions]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [dbo].[Users] ([UserID])
GO

-- FK constraint 84 for [Transactions]
ALTER TABLE [dbo].[Transactions]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 85 for [PaymentMethods]
ALTER TABLE [dbo].[PaymentMethods]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [dbo].[Users] ([UserID])
GO

-- FK constraint 86 for [PaymentTransactions]
ALTER TABLE [dbo].[PaymentTransactions]  WITH CHECK ADD FOREIGN KEY([BookingID])
REFERENCES [dbo].[Bookings] ([BookingID])
GO

-- FK constraint 87 for [PaymentTransactions]
ALTER TABLE [dbo].[PaymentTransactions]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [dbo].[Users] ([UserID])
GO

-- FK constraint 88 for [PaymentTransactions]
ALTER TABLE [dbo].[PaymentTransactions]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
GO

PRINT 'FOREIGN KEY constraints added successfully.';
GO

