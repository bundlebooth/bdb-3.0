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
    INSERT [admin].[EmailTemplates] ([TemplateID], [TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (8, N'payment_confirmation_client', N'Payment Confirmation to Client', 1, 19, 2, N'Payment Confirmed - {{amount}}', N'payment', N'["clientName","vendorName","amount","serviceName","eventDate","dashboardUrl","platformName","platformUrl","currentYear","logoUrl"]', 1, CAST(N'2025-01-14T12:00:00.000' AS DateTime), CAST(N'2025-01-14T12:00:00.000' AS DateTime));
    INSERT [admin].[EmailTemplates] ([TemplateID], [TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (9, N'booking_cancelled_client', N'Booking Cancelled - Client Notification', 1, 20, 2, N'Booking Cancelled - {{serviceName}}', N'booking', N'["clientName","vendorName","serviceName","eventDate","reason","refundAmount","searchUrl","platformName","platformUrl","currentYear","logoUrl"]', 1, CAST(N'2025-01-14T12:00:00.000' AS DateTime), CAST(N'2025-01-14T12:00:00.000' AS DateTime));
    INSERT [admin].[EmailTemplates] ([TemplateID], [TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (10, N'booking_cancelled_vendor', N'Booking Cancelled - Vendor Notification', 1, 21, 2, N'Booking Cancelled by {{clientName}}', N'booking', N'["vendorName","clientName","serviceName","eventDate","reason","dashboardUrl","platformName","platformUrl","currentYear","logoUrl"]', 1, CAST(N'2025-01-14T12:00:00.000' AS DateTime), CAST(N'2025-01-14T12:00:00.000' AS DateTime));
    INSERT [admin].[EmailTemplates] ([TemplateID], [TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (11, N'vendor_application_admin', N'Vendor Application - Admin Notification', 1, 22, 2, N'New Vendor Application: {{businessName}}', N'admin', N'["applicantName","businessName","businessEmail","businessPhone","category","dashboardUrl","platformName","platformUrl","currentYear","logoUrl"]', 1, CAST(N'2025-01-14T12:00:00.000' AS DateTime), CAST(N'2025-01-14T12:00:00.000' AS DateTime));
    INSERT [admin].[EmailTemplates] ([TemplateID], [TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (12, N'vendor_welcome', N'Vendor Welcome Email', 1, 23, 2, N'Welcome to {{platformName}}, {{vendorName}}!', N'welcome', N'["vendorName","businessName","dashboardUrl","incompleteMessage","platformName","platformUrl","currentYear","logoUrl"]', 1, CAST(N'2025-01-14T12:00:00.000' AS DateTime), CAST(N'2025-01-14T12:00:00.000' AS DateTime));
    INSERT [admin].[EmailTemplates] ([TemplateID], [TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (13, N'booking_confirmed_client', N'Booking Confirmed - Client Notification', 1, 24, 2, N'Booking Confirmed with {{vendorName}}!', N'booking', N'["clientName","vendorName","serviceName","eventDate","eventLocation","dashboardUrl","platformName","platformUrl","currentYear","logoUrl"]', 1, CAST(N'2025-01-14T12:00:00.000' AS DateTime), CAST(N'2025-01-14T12:00:00.000' AS DateTime));
    INSERT [admin].[EmailTemplates] ([TemplateID], [TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (14, N'booking_confirmed_vendor', N'Booking Confirmed - Vendor Notification', 1, 25, 2, N'New Confirmed Booking from {{clientName}}!', N'booking', N'["vendorName","clientName","serviceName","eventDate","eventLocation","dashboardUrl","platformName","platformUrl","currentYear","logoUrl"]', 1, CAST(N'2025-01-14T12:00:00.000' AS DateTime), CAST(N'2025-01-14T12:00:00.000' AS DateTime));
    INSERT [admin].[EmailTemplates] ([TemplateID], [TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (15, N'vendor_approved', N'Vendor Profile Approved', 1, 26, 2, N'Your Profile is Approved - Welcome to {{platformName}}!', N'vendor', N'["vendorName","businessName","dashboardUrl","platformName","platformUrl","currentYear","logoUrl"]', 1, CAST(N'2025-01-14T12:00:00.000' AS DateTime), CAST(N'2025-01-14T12:00:00.000' AS DateTime));
    INSERT [admin].[EmailTemplates] ([TemplateID], [TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (16, N'vendor_rejected', N'Vendor Profile Rejected', 1, 27, 2, N'Profile Review Update - {{businessName}}', N'vendor', N'["vendorName","businessName","rejectionReason","dashboardUrl","platformName","platformUrl","currentYear","logoUrl"]', 1, CAST(N'2025-01-14T12:00:00.000' AS DateTime), CAST(N'2025-01-14T12:00:00.000' AS DateTime));
    INSERT [admin].[EmailTemplates] ([TemplateID], [TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (17, N'client_welcome', N'Client Welcome Email', 1, 28, 2, N'Welcome to {{platformName}}, {{clientName}}!', N'welcome', N'["clientName","searchUrl","dashboardUrl","platformName","platformUrl","currentYear","logoUrl"]', 1, CAST(N'2025-01-17T12:00:00.000' AS DateTime), CAST(N'2025-01-17T12:00:00.000' AS DateTime));
    INSERT [admin].[EmailTemplates] ([TemplateID], [TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (18, N'client_to_vendor', N'Client to Vendor Welcome', 1, 29, 2, N'Welcome to {{platformName}} as a Vendor, {{vendorName}}!', N'welcome', N'["vendorName","businessName","dashboardUrl","platformName","platformUrl","currentYear","logoUrl"]', 1, CAST(N'2025-01-17T12:00:00.000' AS DateTime), CAST(N'2025-01-17T12:00:00.000' AS DateTime));

    SET IDENTITY_INSERT [admin].[EmailTemplates] OFF;

    PRINT 'Inserted 16 records into [admin].[EmailTemplates].';
END
ELSE
BEGIN
    PRINT 'Table [admin].[EmailTemplates] already contains data. Adding new templates if missing...';
    
    -- Add event_reminder template
    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplates] WHERE [TemplateKey] = 'event_reminder')
    BEGIN
        DECLARE @EventReminderBodyID INT;
        SELECT @EventReminderBodyID = ComponentID FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'Event Reminder';
        IF @EventReminderBodyID IS NOT NULL
        BEGIN
            INSERT [admin].[EmailTemplates] ([TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt])
            VALUES (N'event_reminder', N'Event Reminder', 1, @EventReminderBodyID, 2, N'Reminder: Your {{serviceName}} is in {{daysUntilEvent}}!', N'booking', N'["recipientName","daysUntilEvent","serviceName","eventDate","eventTime","location","otherPartyLabel","otherPartyName","frontendUrl","platformName","logoUrl"]', 1, GETDATE(), GETDATE());
            PRINT 'Added event_reminder template';
        END
    END

    -- Add booking_action_reminder template
    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplates] WHERE [TemplateKey] = 'booking_action_reminder')
    BEGIN
        DECLARE @ActionReminderBodyID INT;
        SELECT @ActionReminderBodyID = ComponentID FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'Booking Action Reminder';
        IF @ActionReminderBodyID IS NOT NULL
        BEGIN
            INSERT [admin].[EmailTemplates] ([TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt])
            VALUES (N'booking_action_reminder', N'Booking Action Reminder', 1, @ActionReminderBodyID, 2, N'{{actionSubject}} - {{serviceName}}', N'booking', N'["recipientName","actionSubject","actionMessage","serviceName","eventDate","otherPartyLabel","otherPartyName","actionUrl","actionButtonText","frontendUrl","platformName","logoUrl"]', 1, GETDATE(), GETDATE());
            PRINT 'Added booking_action_reminder template';
        END
    END

    -- Add analytics_summary template
    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplates] WHERE [TemplateKey] = 'analytics_summary')
    BEGIN
        DECLARE @AnalyticsBodyID INT;
        SELECT @AnalyticsBodyID = ComponentID FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'Analytics Summary';
        IF @AnalyticsBodyID IS NOT NULL
        BEGIN
            INSERT [admin].[EmailTemplates] ([TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt])
            VALUES (N'analytics_summary', N'Analytics Summary', 1, @AnalyticsBodyID, 2, N'Your {{summaryPeriod}} Analytics Summary', N'vendor', N'["recipientName","summaryPeriod","periodRange","profileViews","viewsChange","bookings","bookingsChange","revenue","revenueChange","conversionRate","frontendUrl","platformName","logoUrl"]', 1, GETDATE(), GETDATE());
            PRINT 'Added analytics_summary template';
        END
    END

    -- Add account_suspended template
    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplates] WHERE [TemplateKey] = 'account_suspended')
    BEGIN
        DECLARE @SuspendedBodyID INT;
        SELECT @SuspendedBodyID = ComponentID FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'Account Suspended';
        IF @SuspendedBodyID IS NOT NULL
        BEGIN
            INSERT [admin].[EmailTemplates] ([TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt])
            VALUES (N'account_suspended', N'Account Suspended', 1, @SuspendedBodyID, 2, N'Your {{platformName}} Account Has Been Suspended', N'system', N'["recipientName","suspensionReason","platformName","logoUrl"]', 1, GETDATE(), GETDATE());
            PRINT 'Added account_suspended template';
        END
    END

    -- Add account_reactivated template
    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplates] WHERE [TemplateKey] = 'account_reactivated')
    BEGIN
        DECLARE @ReactivatedBodyID INT;
        SELECT @ReactivatedBodyID = ComponentID FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'Account Reactivated';
        IF @ReactivatedBodyID IS NOT NULL
        BEGIN
            INSERT [admin].[EmailTemplates] ([TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt])
            VALUES (N'account_reactivated', N'Account Reactivated', 1, @ReactivatedBodyID, 2, N'Your {{platformName}} Account Has Been Reactivated', N'system', N'["recipientName","frontendUrl","platformName","logoUrl"]', 1, GETDATE(), GETDATE());
            PRINT 'Added account_reactivated template';
        END
    END
END
GO
