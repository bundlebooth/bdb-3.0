/*
    Migration Script: Data - [FAQs]
    Phase: 900 - Data
    Script: cu_900_42_dbo.FAQs.sql
    Description: Inserts data into [admin].[FAQs]
    
    Execution Order: 42
    Record Count: 4
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [admin].[FAQs]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [admin].[FAQs])
BEGIN
    SET IDENTITY_INSERT [admin].[FAQs] ON;

    INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (1, N'TEST How do I book a vendor?', N'Browse vendors on our platform, select one you like, choose your date and time, and complete the booking process. You''ll receive a confirmation email once the vendor accepts.', N'Booking', 1, 1, CAST(N'2025-12-10T18:59:37.3300000' AS DateTime2), CAST(N'2025-12-12T01:22:20.0833333' AS DateTime2));
    INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (2, N'What is the cancellation policy?', N'Cancellation policies vary by vendor. Check the specific vendor''s profile for their cancellation terms. Generally, cancellations made 48+ hours in advance receive a full refund.', N'Booking', 2, 1, CAST(N'2025-12-10T18:59:37.3300000' AS DateTime2), CAST(N'2025-12-10T18:59:37.3300000' AS DateTime2));
    INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (3, N'How do payments work?', N'Payments are processed securely through Stripe. You pay when booking, and the vendor receives payment after the service is completed, minus our platform fee.', N'Payments', 3, 1, CAST(N'2025-12-10T18:59:37.3300000' AS DateTime2), CAST(N'2025-12-10T18:59:37.3300000' AS DateTime2));
    INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (4, N'How do I become a vendor?', N'Click "Become a Vendor" in the navigation, complete the registration form, set up your profile, connect your Stripe account, and start receiving bookings!', N'Vendors', 4, 1, CAST(N'2025-12-10T18:59:37.3300000' AS DateTime2), CAST(N'2025-12-10T18:59:37.3300000' AS DateTime2));

    SET IDENTITY_INSERT [admin].[FAQs] OFF;

    PRINT 'Inserted 4 records into [admin].[FAQs].';
END
ELSE
BEGIN
    PRINT 'Table [admin].[FAQs] already contains data. Skipping.';
END
GO
