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

    -- Add client_to_vendor_welcome template (alias)
    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplates] WHERE [TemplateKey] = 'client_to_vendor_welcome')
    BEGIN
        INSERT [admin].[EmailTemplates] ([TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt])
        VALUES (N'client_to_vendor_welcome', N'Client to Vendor Welcome', 1, 29, 2, N'Welcome to {{platformName}} as a Vendor, {{vendorName}}!', N'welcome', N'["vendorName","businessName","dashboardUrl","platformName","platformUrl","currentYear","logoUrl"]', 1, GETDATE(), GETDATE());
        PRINT 'Added client_to_vendor_welcome template';
    END

    -- Add password_reset template
    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplates] WHERE [TemplateKey] = 'password_reset')
    BEGIN
        DECLARE @PasswordResetBodyID INT;
        SELECT @PasswordResetBodyID = ComponentID FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'Password Reset';
        IF @PasswordResetBodyID IS NOT NULL
        BEGIN
            INSERT [admin].[EmailTemplates] ([TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt])
            VALUES (N'password_reset', N'Password Reset Request', 1, @PasswordResetBodyID, 2, N'Reset Your {{platformName}} Password', N'account', N'["userName","resetUrl","expiryTime","platformName","currentYear","unsubscribeUrl","preferencesUrl"]', 1, GETDATE(), GETDATE());
            PRINT 'Added password_reset template';
        END
    END

    -- Add password_changed template
    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplates] WHERE [TemplateKey] = 'password_changed')
    BEGIN
        DECLARE @PasswordChangedBodyID INT;
        SELECT @PasswordChangedBodyID = ComponentID FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'Password Changed';
        IF @PasswordChangedBodyID IS NOT NULL
        BEGIN
            INSERT [admin].[EmailTemplates] ([TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt])
            VALUES (N'password_changed', N'Password Changed Confirmation', 1, @PasswordChangedBodyID, 2, N'Your {{platformName}} Password Has Been Changed', N'account', N'["userName","platformName","currentYear"]', 1, GETDATE(), GETDATE());
            PRINT 'Added password_changed template';
        END
    END

    -- Add support_ticket_opened template
    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplates] WHERE [TemplateKey] = 'support_ticket_opened')
    BEGIN
        DECLARE @TicketOpenedBodyID INT;
        SELECT @TicketOpenedBodyID = ComponentID FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'Support Ticket Opened';
        IF @TicketOpenedBodyID IS NOT NULL
        BEGIN
            INSERT [admin].[EmailTemplates] ([TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt])
            VALUES (N'support_ticket_opened', N'Support Ticket Opened', 1, @TicketOpenedBodyID, 2, N'Support Ticket #{{ticketId}} - We Received Your Request', N'support', N'["userName","ticketId","ticketSubject","ticketCategory","dashboardUrl","platformName","currentYear","unsubscribeUrl","preferencesUrl"]', 1, GETDATE(), GETDATE());
            PRINT 'Added support_ticket_opened template';
        END
    END

    -- Add support_ticket_in_progress template
    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplates] WHERE [TemplateKey] = 'support_ticket_in_progress')
    BEGIN
        DECLARE @TicketInProgressBodyID INT;
        SELECT @TicketInProgressBodyID = ComponentID FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'Support Ticket In Progress';
        IF @TicketInProgressBodyID IS NOT NULL
        BEGIN
            INSERT [admin].[EmailTemplates] ([TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt])
            VALUES (N'support_ticket_in_progress', N'Support Ticket In Progress', 1, @TicketInProgressBodyID, 2, N'Support Ticket #{{ticketId}} - Now In Progress', N'support', N'["userName","ticketId","ticketSubject","dashboardUrl","platformName","currentYear","unsubscribeUrl","preferencesUrl"]', 1, GETDATE(), GETDATE());
            PRINT 'Added support_ticket_in_progress template';
        END
    END

    -- Add support_ticket_closed template
    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplates] WHERE [TemplateKey] = 'support_ticket_closed')
    BEGIN
        DECLARE @TicketClosedBodyID INT;
        SELECT @TicketClosedBodyID = ComponentID FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'Support Ticket Closed';
        IF @TicketClosedBodyID IS NOT NULL
        BEGIN
            INSERT [admin].[EmailTemplates] ([TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt])
            VALUES (N'support_ticket_closed', N'Support Ticket Closed', 1, @TicketClosedBodyID, 2, N'Support Ticket #{{ticketId}} - Resolved', N'support', N'["userName","ticketId","ticketSubject","resolution","dashboardUrl","platformName","currentYear","unsubscribeUrl","preferencesUrl"]', 1, GETDATE(), GETDATE());
            PRINT 'Added support_ticket_closed template';
        END
    END

    -- Add support_ticket_reply template
    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplates] WHERE [TemplateKey] = 'support_ticket_reply')
    BEGIN
        DECLARE @TicketReplyBodyID INT;
        SELECT @TicketReplyBodyID = ComponentID FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'Support Ticket Reply';
        IF @TicketReplyBodyID IS NOT NULL
        BEGIN
            INSERT [admin].[EmailTemplates] ([TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt])
            VALUES (N'support_ticket_reply', N'Support Ticket Reply', 1, @TicketReplyBodyID, 2, N'New Reply on Support Ticket #{{ticketId}}', N'support', N'["userName","ticketId","replierName","replyPreview","dashboardUrl","platformName","currentYear","unsubscribeUrl","preferencesUrl"]', 1, GETDATE(), GETDATE());
            PRINT 'Added support_ticket_reply template';
        END
    END

    -- Add review_request template (post-event review request)
    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplates] WHERE [TemplateKey] = 'review_request')
    BEGIN
        DECLARE @ReviewRequestBodyID INT;
        SELECT @ReviewRequestBodyID = ComponentID FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'Review Request';
        IF @ReviewRequestBodyID IS NOT NULL
        BEGIN
            INSERT [admin].[EmailTemplates] ([TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt])
            VALUES (N'review_request', N'Post-Event Review Request', 1, @ReviewRequestBodyID, 2, N'How was your experience with {{vendorName}}?', N'review', N'["clientName","vendorName","serviceName","eventDate","reviewUrl","platformName","platformUrl","currentYear","logoUrl"]', 1, GETDATE(), GETDATE());
            PRINT 'Added review_request template';
        END
    END

    -- Add support_message_received template (sent to user when support team replies)
    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplates] WHERE [TemplateKey] = 'support_message_received')
    BEGIN
        DECLARE @SupportReceivedBodyID INT;
        SELECT @SupportReceivedBodyID = ComponentID FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'Support Message Received';
        IF @SupportReceivedBodyID IS NOT NULL
        BEGIN
            INSERT [admin].[EmailTemplates] ([TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt])
            VALUES (N'support_message_received', N'Support Message Received', 1, @SupportReceivedBodyID, 2, N'New Message from Planbeau Support', N'support', N'["userName","messagePreview","dashboardUrl","platformName","platformUrl","currentYear","logoUrl"]', 1, GETDATE(), GETDATE());
            PRINT 'Added support_message_received template';
        END
    END

    -- Add new_support_message template (sent to support team when user sends message)
    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplates] WHERE [TemplateKey] = 'new_support_message')
    BEGIN
        DECLARE @NewSupportBodyID INT;
        SELECT @NewSupportBodyID = ComponentID FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'New Support Message';
        IF @NewSupportBodyID IS NOT NULL
        BEGIN
            INSERT [admin].[EmailTemplates] ([TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt])
            VALUES (N'new_support_message', N'New Support Message Alert', 1, @NewSupportBodyID, 2, N'[SUPPORT] New Message from {{userName}}', N'support', N'["userName","userEmail","conversationId","messagePreview","adminUrl","platformName","platformUrl","currentYear","logoUrl"]', 1, GETDATE(), GETDATE());
            PRINT 'Added new_support_message template';
        END
    END

    -- Add payment_failed template (for automation rules)
    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplates] WHERE [TemplateKey] = 'payment_failed')
    BEGIN
        DECLARE @PaymentFailedBodyID INT;
        SELECT @PaymentFailedBodyID = ComponentID FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'payment_failed_body';
        IF @PaymentFailedBodyID IS NOT NULL
        BEGIN
            INSERT [admin].[EmailTemplates] ([TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt])
            VALUES (N'payment_failed', N'Payment Failed - Retry Request', 1, @PaymentFailedBodyID, 2, N'Action Required: Payment Failed for Your Booking', N'booking', N'recipientName,bookingId,serviceName,vendorName,amount,retryUrl', 1, GETDATE(), GETDATE());
            PRINT 'Added payment_failed template';
        END
    END

    -- Add vendor_inactivity template (for automation rules)
    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplates] WHERE [TemplateKey] = 'vendor_inactivity')
    BEGIN
        DECLARE @VendorInactivityBodyID INT;
        SELECT @VendorInactivityBodyID = ComponentID FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'vendor_inactivity_body';
        IF @VendorInactivityBodyID IS NOT NULL
        BEGIN
            INSERT [admin].[EmailTemplates] ([TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt])
            VALUES (N'vendor_inactivity', N'Vendor Inactivity Alert', 1, @VendorInactivityBodyID, 2, N'We Miss You! Your Planbeau Profile Needs Attention', N'vendor', N'recipientName,vendorName,lastActiveDate,dashboardUrl', 1, GETDATE(), GETDATE());
            PRINT 'Added vendor_inactivity template';
        END
    END

    -- Add user_inactivity template (for automation rules)
    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplates] WHERE [TemplateKey] = 'user_inactivity')
    BEGIN
        DECLARE @UserInactivityBodyID INT;
        SELECT @UserInactivityBodyID = ComponentID FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'user_inactivity_body';
        IF @UserInactivityBodyID IS NOT NULL
        BEGIN
            INSERT [admin].[EmailTemplates] ([TemplateKey], [TemplateName], [HeaderComponentID], [BodyComponentID], [FooterComponentID], [Subject], [Category], [AvailableVariables], [IsActive], [CreatedAt], [UpdatedAt])
            VALUES (N'user_inactivity', N'User Inactivity Alert', 1, @UserInactivityBodyID, 2, N'We Miss You! Come Back to Planbeau', N'user', N'recipientName,searchUrl,dashboardUrl', 1, GETDATE(), GETDATE());
            PRINT 'Added user_inactivity template';
        END
    END
END
GO
