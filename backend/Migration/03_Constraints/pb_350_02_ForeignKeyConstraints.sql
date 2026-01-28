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
ALTER TABLE [admin].[EmailTemplates]  WITH CHECK ADD FOREIGN KEY([BodyComponentID])
REFERENCES [admin].[EmailTemplateComponents] ([ComponentID])
GO

-- FK constraint 2 for [EmailTemplates]
ALTER TABLE [admin].[EmailTemplates]  WITH CHECK ADD FOREIGN KEY([FooterComponentID])
REFERENCES [admin].[EmailTemplateComponents] ([ComponentID])
GO

-- FK constraint 3 for [EmailTemplates]
ALTER TABLE [admin].[EmailTemplates]  WITH CHECK ADD FOREIGN KEY([HeaderComponentID])
REFERENCES [admin].[EmailTemplateComponents] ([ComponentID])
GO

-- FK constraint 4 for [ContentBanners]
ALTER TABLE [admin].[ContentBanners]  WITH CHECK ADD FOREIGN KEY([CreatedBy])
REFERENCES [users].[Users] ([UserID])
GO

-- FK constraint 5 for [Announcements]
ALTER TABLE [admin].[Announcements]  WITH CHECK ADD FOREIGN KEY([CreatedBy])
REFERENCES [users].[Users] ([UserID])
GO

-- FK constraint 6 for [VendorFeatures]
ALTER TABLE [vendors].[VendorFeatures]  WITH CHECK ADD FOREIGN KEY([CategoryID])
REFERENCES [vendors].[VendorFeatureCategories] ([CategoryID])
GO

-- FK constraint 7 for [VendorProfiles]
ALTER TABLE [vendors].[VendorProfiles]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [users].[Users] ([UserID])
GO

-- FK constraint 8 for [UserSessions]
ALTER TABLE [users].[UserSessions]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [users].[Users] ([UserID])
GO

-- FK constraint 9 for [UserLocations]
ALTER TABLE [users].[UserLocations]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [users].[Users] ([UserID])
GO

-- FK constraint 10 for [SecurityLogs]
ALTER TABLE [admin].[SecurityLogs]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [users].[Users] ([UserID])
GO

-- FK constraint 11 for [SearchHistory]
ALTER TABLE [users].[SearchHistory]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [users].[Users] ([UserID])
GO

-- FK constraint 12 for [Notifications]
ALTER TABLE [notifications].[Notifications]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [users].[Users] ([UserID])
GO

-- FK constraint 13 for [EmailLogs]
ALTER TABLE [admin].[EmailLogs]  WITH CHECK ADD FOREIGN KEY([BookingID])
REFERENCES [bookings].[Bookings] ([BookingID])
GO

-- FK constraint 14 for [EmailLogs]
ALTER TABLE [admin].[EmailLogs]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [users].[Users] ([UserID])
GO

-- FK constraint 15 for [SupportTickets]
ALTER TABLE [admin].[SupportTickets]  WITH CHECK ADD FOREIGN KEY([AssignedTo])
REFERENCES [users].[Users] ([UserID])
GO

-- FK constraint 16 for [SupportTickets]
ALTER TABLE [admin].[SupportTickets]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [users].[Users] ([UserID])
GO

-- FK constraint 17 for [VendorCategories]
ALTER TABLE [vendors].[VendorCategories]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 18 for [VendorAdditionalDetails]
ALTER TABLE [vendors].[VendorAdditionalDetails]  WITH CHECK ADD FOREIGN KEY([QuestionID])
REFERENCES [admin].[CategoryQuestions] ([QuestionID])
ON DELETE CASCADE
GO

-- FK constraint 19 for [VendorAdditionalDetails]
ALTER TABLE [vendors].[VendorAdditionalDetails]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
ON DELETE CASCADE
GO

-- FK constraint 20 for [VendorBusinessHours]
ALTER TABLE [vendors].[VendorBusinessHours]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 21 for [VendorAvailabilityExceptions]
ALTER TABLE [vendors].[VendorAvailabilityExceptions]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 22 for [VendorImages]
ALTER TABLE [vendors].[VendorImages]  WITH CHECK ADD  CONSTRAINT [FK_VendorImages_VendorProfiles] FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 23 for [VendorPortfolio]
ALTER TABLE [vendors].[VendorPortfolio]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 24 for [VendorPortfolioAlbums]
ALTER TABLE [vendors].[VendorPortfolioAlbums]  WITH CHECK ADD  CONSTRAINT [FK_VendorPortfolioAlbums_VendorProfiles] FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 25 for [VendorFAQs]
ALTER TABLE [vendors].[VendorFAQs]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 26 for [VendorSocialMedia]
ALTER TABLE [vendors].[VendorSocialMedia]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 27 for [VendorTeam]
ALTER TABLE [vendors].[VendorTeam]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 28 for [VendorServiceAreas]
ALTER TABLE [vendors].[VendorServiceAreas]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 29 for [VendorSelectedFeatures]
ALTER TABLE [vendors].[VendorSelectedFeatures]  WITH CHECK ADD FOREIGN KEY([FeatureID])
REFERENCES [vendors].[VendorFeatures] ([FeatureID])
GO

-- FK constraint 30 for [VendorSelectedFeatures]
ALTER TABLE [vendors].[VendorSelectedFeatures]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
ON DELETE CASCADE
GO

-- FK constraint 31 for [VendorProfileViews]
ALTER TABLE [vendors].[VendorProfileViews]  WITH CHECK ADD  CONSTRAINT [FK_VendorProfileViews_User] FOREIGN KEY([ViewerUserID])
REFERENCES [users].[Users] ([UserID])
ON DELETE SET NULL
GO

-- FK constraint 32 for [VendorProfileViews]
ALTER TABLE [vendors].[VendorProfileViews]  WITH CHECK ADD  CONSTRAINT [FK_VendorProfileViews_VendorProfile] FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
ON DELETE CASCADE
GO

-- FK constraint 33 for [ServiceCategories]
ALTER TABLE [vendors].[ServiceCategories]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 34 for [Packages]
ALTER TABLE [vendors].[Packages]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 35 for [Services]
ALTER TABLE [vendors].[Services]  WITH CHECK ADD FOREIGN KEY([CategoryID])
REFERENCES [vendors].[ServiceCategories] ([CategoryID])
GO

-- FK constraint 36 for [Services]
ALTER TABLE [vendors].[Services]  WITH CHECK ADD  CONSTRAINT [FK_Services_LinkedPredefinedService] FOREIGN KEY([LinkedPredefinedServiceID])
REFERENCES [admin].[PredefinedServices] ([PredefinedServiceID])
ON DELETE SET NULL
GO

-- FK constraint 37 for [Services]
ALTER TABLE [vendors].[Services]  WITH CHECK ADD  CONSTRAINT [FK_Services_VendorProfileID] FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 38 for [VendorSelectedServices]
ALTER TABLE [vendors].[VendorSelectedServices]  WITH CHECK ADD FOREIGN KEY([PredefinedServiceID])
REFERENCES [admin].[PredefinedServices] ([PredefinedServiceID])
GO

-- FK constraint 39 for [VendorSelectedServices]
ALTER TABLE [vendors].[VendorSelectedServices]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 40 for [VendorCategoryAnswers]
ALTER TABLE [vendors].[VendorCategoryAnswers]  WITH CHECK ADD FOREIGN KEY([QuestionID])
REFERENCES [admin].[CategoryQuestions] ([QuestionID])
GO

-- FK constraint 41 for [VendorCategoryAnswers]
ALTER TABLE [vendors].[VendorCategoryAnswers]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 42 for [ServiceImages]
ALTER TABLE [vendors].[ServiceImages]  WITH CHECK ADD FOREIGN KEY([ServiceID])
REFERENCES [vendors].[Services] ([ServiceID])
GO

-- FK constraint 43 for [ServiceAddOns]
ALTER TABLE [vendors].[ServiceAddOns]  WITH CHECK ADD FOREIGN KEY([ServiceID])
REFERENCES [vendors].[Services] ([ServiceID])
GO

-- FK constraint 44 for [ServiceAvailability]
ALTER TABLE [vendors].[ServiceAvailability]  WITH CHECK ADD FOREIGN KEY([ServiceID])
REFERENCES [vendors].[Services] ([ServiceID])
GO

-- FK constraint 45 for [TimeSlots]
ALTER TABLE [bookings].[TimeSlots]  WITH CHECK ADD FOREIGN KEY([ServiceID])
REFERENCES [vendors].[Services] ([ServiceID])
GO

-- FK constraint 46 for [TimeSlots]
ALTER TABLE [bookings].[TimeSlots]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 47 for [VendorPortfolioImages]
ALTER TABLE [vendors].[VendorPortfolioImages]  WITH CHECK ADD  CONSTRAINT [FK_VendorPortfolioImages_Albums] FOREIGN KEY([AlbumID])
REFERENCES [vendors].[VendorPortfolioAlbums] ([AlbumID])
ON DELETE CASCADE
GO

-- FK constraint 48 for [VendorPortfolioImages]
ALTER TABLE [vendors].[VendorPortfolioImages]  WITH CHECK ADD  CONSTRAINT [FK_VendorPortfolioImages_VendorProfiles] FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 49 for [Favorites]
ALTER TABLE [users].[Favorites]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [users].[Users] ([UserID])
GO

-- FK constraint 50 for [Favorites]
ALTER TABLE [users].[Favorites]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 51 for [Reviews]
ALTER TABLE [vendors].[Reviews]  WITH CHECK ADD FOREIGN KEY([BookingID])
REFERENCES [bookings].[Bookings] ([BookingID])
GO

-- FK constraint 52 for [Reviews]
ALTER TABLE [vendors].[Reviews]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [users].[Users] ([UserID])
GO

-- FK constraint 53 for [Reviews]
ALTER TABLE [vendors].[Reviews]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 54 for [ReviewMedia]
ALTER TABLE [vendors].[ReviewMedia]  WITH CHECK ADD FOREIGN KEY([ReviewID])
REFERENCES [vendors].[Reviews] ([ReviewID])
GO

-- FK constraint 55 for [Conversations]
ALTER TABLE [messages].[Conversations]  WITH CHECK ADD FOREIGN KEY([BookingID])
REFERENCES [bookings].[Bookings] ([BookingID])
GO

-- FK constraint 56 for [Conversations]
ALTER TABLE [messages].[Conversations]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [users].[Users] ([UserID])
GO

-- FK constraint 57 for [Conversations]
ALTER TABLE [messages].[Conversations]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 58 for [SupportConversations]
ALTER TABLE [admin].[SupportConversations]  WITH CHECK ADD FOREIGN KEY([ConversationID])
REFERENCES [messages].[Conversations] ([ConversationID])
GO

-- FK constraint 59 for [SupportConversations]
ALTER TABLE [admin].[SupportConversations]  WITH CHECK ADD FOREIGN KEY([TicketID])
REFERENCES [admin].[SupportTickets] ([TicketID])
GO

-- FK constraint 60 for [SupportTicketMessages]
ALTER TABLE [admin].[SupportTicketMessages]  WITH CHECK ADD FOREIGN KEY([SenderID])
REFERENCES [users].[Users] ([UserID])
GO

-- FK constraint 61 for [SupportTicketMessages]
ALTER TABLE [admin].[SupportTicketMessages]  WITH CHECK ADD FOREIGN KEY([TicketID])
REFERENCES [admin].[SupportTickets] ([TicketID])
GO

-- FK constraint 62 for [Messages]
ALTER TABLE [messages].[Messages]  WITH CHECK ADD FOREIGN KEY([ConversationID])
REFERENCES [messages].[Conversations] ([ConversationID])
GO

-- FK constraint 63 for [Messages]
ALTER TABLE [messages].[Messages]  WITH CHECK ADD FOREIGN KEY([SenderID])
REFERENCES [users].[Users] ([UserID])
GO

-- FK constraint 64 for [MessageAttachments]
ALTER TABLE [messages].[MessageAttachments]  WITH CHECK ADD FOREIGN KEY([MessageID])
REFERENCES [messages].[Messages] ([MessageID])
GO

-- FK constraint 65 for [Bookings]
ALTER TABLE [bookings].[Bookings]  WITH CHECK ADD FOREIGN KEY([ServiceID])
REFERENCES [vendors].[Services] ([ServiceID])
GO

-- FK constraint 66 for [Bookings]
ALTER TABLE [bookings].[Bookings]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [users].[Users] ([UserID])
GO

-- FK constraint 67 for [Bookings]
ALTER TABLE [bookings].[Bookings]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 68 for [BookingRequests]
ALTER TABLE [bookings].[BookingRequests]  WITH CHECK ADD FOREIGN KEY([ServiceID])
REFERENCES [vendors].[Services] ([ServiceID])
GO

-- FK constraint 69 for [BookingRequests]
ALTER TABLE [bookings].[BookingRequests]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [users].[Users] ([UserID])
GO

-- FK constraint 70 for [BookingRequests]
ALTER TABLE [bookings].[BookingRequests]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 71 for [BookingServices]
ALTER TABLE [bookings].[BookingServices]  WITH CHECK ADD FOREIGN KEY([AddOnID])
REFERENCES [vendors].[ServiceAddOns] ([AddOnID])
GO

-- FK constraint 72 for [BookingServices]
ALTER TABLE [bookings].[BookingServices]  WITH CHECK ADD FOREIGN KEY([BookingID])
REFERENCES [bookings].[Bookings] ([BookingID])
GO

-- FK constraint 73 for [BookingServices]
ALTER TABLE [bookings].[BookingServices]  WITH CHECK ADD FOREIGN KEY([ServiceID])
REFERENCES [vendors].[Services] ([ServiceID])
GO

-- FK constraint 74 for [BookingExpenses]
ALTER TABLE [bookings].[BookingExpenses]  WITH CHECK ADD FOREIGN KEY([BookingID])
REFERENCES [bookings].[Bookings] ([BookingID])
ON DELETE CASCADE
GO

-- FK constraint 75 for [BookingExpenses]
ALTER TABLE [bookings].[BookingExpenses]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 76 for [BookingTimeline]
ALTER TABLE [bookings].[BookingTimeline]  WITH CHECK ADD FOREIGN KEY([BookingID])
REFERENCES [bookings].[Bookings] ([BookingID])
GO

-- FK constraint 77 for [BookingTimeline]
ALTER TABLE [bookings].[BookingTimeline]  WITH CHECK ADD FOREIGN KEY([ChangedBy])
REFERENCES [users].[Users] ([UserID])
GO

-- FK constraint 78 for [Invoices]
ALTER TABLE [invoices].[Invoices]  WITH CHECK ADD FOREIGN KEY([BookingID])
REFERENCES [bookings].[Bookings] ([BookingID])
ON DELETE CASCADE
GO

-- FK constraint 79 for [Invoices]
ALTER TABLE [invoices].[Invoices]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [users].[Users] ([UserID])
GO

-- FK constraint 80 for [Invoices]
ALTER TABLE [invoices].[Invoices]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 81 for [InvoiceItems]
ALTER TABLE [invoices].[InvoiceItems]  WITH CHECK ADD FOREIGN KEY([InvoiceID])
REFERENCES [invoices].[Invoices] ([InvoiceID])
ON DELETE CASCADE
GO

-- FK constraint 82 for [Transactions]
ALTER TABLE [payments].[Transactions]  WITH CHECK ADD FOREIGN KEY([BookingID])
REFERENCES [bookings].[Bookings] ([BookingID])
GO

-- FK constraint 83 for [Transactions]
ALTER TABLE [payments].[Transactions]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [users].[Users] ([UserID])
GO

-- FK constraint 84 for [Transactions]
ALTER TABLE [payments].[Transactions]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
GO

-- FK constraint 85 for [PaymentMethods]
ALTER TABLE [payments].[PaymentMethods]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [users].[Users] ([UserID])
GO

-- FK constraint 86 for [PaymentTransactions]
ALTER TABLE [payments].[PaymentTransactions]  WITH CHECK ADD FOREIGN KEY([BookingID])
REFERENCES [bookings].[Bookings] ([BookingID])
GO

-- FK constraint 87 for [PaymentTransactions]
ALTER TABLE [payments].[PaymentTransactions]  WITH CHECK ADD FOREIGN KEY([UserID])
REFERENCES [users].[Users] ([UserID])
GO

-- FK constraint 88 for [PaymentTransactions]
ALTER TABLE [payments].[PaymentTransactions]  WITH CHECK ADD FOREIGN KEY([VendorProfileID])
REFERENCES [vendors].[VendorProfiles] ([VendorProfileID])
GO

PRINT 'FOREIGN KEY constraints added successfully.';
GO

