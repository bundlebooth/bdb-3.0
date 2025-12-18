/*
    Migration Script: Data - [EmailTemplates]
    Phase: 900 - Data
    Script: cu_900_03_dbo.EmailTemplates.sql
    Description: Inserts data into [admin].[EmailTemplates]
    
    Execution Order: 3
    Record Count: 7
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [admin].[EmailTemplates]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [admin].[EmailTemplates])
BEGIN
    SET IDENTITY_INSERT [admin].[EmailTemplates] ON;

    INSERT [admin].[EmailTemplates] ([TemplateID], [TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (1, N'auth_2fa', N'2FA Verification', 1, 3, 2, N'Your Verification Code', N'authentication', N'["userName","code","platformName","platformUrl","currentYear"]', 1, CAST(N'2025-10-30T20:44:22.117' AS DateTime), CAST(N'2025-10-30T20:44:22.117' AS DateTime));
    INSERT [admin].[EmailTemplates] ([TemplateID], [TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (2, N'booking_request_vendor', N'Booking Request to Vendor', 1, 4, 2, N'New Booking Request', N'booking', N'["vendorName","clientName","serviceName","eventDate","location","budget","dashboardUrl","platformName","platformUrl","currentYear"]', 1, CAST(N'2025-10-30T20:44:22.117' AS DateTime), CAST(N'2025-10-30T20:44:22.117' AS DateTime));
    INSERT [admin].[EmailTemplates] ([TemplateID], [TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (3, N'booking_accepted_client', N'Booking Accepted', 1, 5, 2, N'Your Booking Was Accepted!', N'booking', N'["clientName","vendorName","serviceName","dashboardUrl","platformName","platformUrl","currentYear"]', 1, CAST(N'2025-10-30T20:44:22.117' AS DateTime), CAST(N'2025-10-30T20:44:22.117' AS DateTime));
    INSERT [admin].[EmailTemplates] ([TemplateID], [TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (4, N'booking_rejected_client', N'Booking Rejected', 1, 6, 2, N'Booking Request Update', N'booking', N'["clientName","vendorName","serviceName","eventDate","searchUrl","platformName","platformUrl","currentYear"]', 1, CAST(N'2025-10-30T20:44:22.117' AS DateTime), CAST(N'2025-10-30T20:44:22.117' AS DateTime));
    INSERT [admin].[EmailTemplates] ([TemplateID], [TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (5, N'message_vendor_to_client', N'Message from Vendor', 1, 7, 2, N'New Message from {{vendorName}}', N'messaging', N'["clientName","vendorName","messageContent","dashboardUrl","platformName","platformUrl","currentYear"]', 1, CAST(N'2025-10-30T20:44:22.117' AS DateTime), CAST(N'2025-10-30T20:44:22.117' AS DateTime));
    INSERT [admin].[EmailTemplates] ([TemplateID], [TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (6, N'message_client_to_vendor', N'Message from Client', 1, 8, 2, N'New Message from {{clientName}}', N'messaging', N'["vendorName","clientName","messageContent","dashboardUrl","platformName","platformUrl","currentYear"]', 1, CAST(N'2025-10-30T20:44:22.117' AS DateTime), CAST(N'2025-10-30T20:44:22.117' AS DateTime));
    INSERT [admin].[EmailTemplates] ([TemplateID], [TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (7, N'payment_received_vendor', N'Payment Received', 1, 9, 2, N'Payment Received - {{amount}}', N'payment', N'["vendorName","clientName","amount","serviceName","eventDate","dashboardUrl","platformName","platformUrl","currentYear"]', 1, CAST(N'2025-10-30T20:44:22.117' AS DateTime), CAST(N'2025-10-30T20:44:22.117' AS DateTime));

    SET IDENTITY_INSERT [admin].[EmailTemplates] OFF;

    PRINT 'Inserted 7 records into [admin].[EmailTemplates].';
END
ELSE
BEGIN
    PRINT 'Table [admin].[EmailTemplates] already contains data. Skipping.';
END
GO
