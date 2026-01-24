/*
    Migration Script: Data - [EmailTemplateComponents]
    Phase: 900 - Data
    Script: cu_900_04_dbo.EmailTemplateComponents.sql
    Description: Inserts data into [admin].[EmailTemplateComponents]
    
    Execution Order: 4
    Record Count: 18
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [admin].[EmailTemplateComponents]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [admin].[EmailTemplateComponents])
BEGIN
    SET IDENTITY_INSERT [admin].[EmailTemplateComponents] ON;

    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (1, N'header', N'Default Header', N'<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,''Helvetica Neue'',Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff"><tr><td align="center" style="padding:40px 20px 30px 20px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"><tr><td align="center"><img src="{{logoUrl}}" alt="{{platformName}}" style="height:40px;width:auto;display:block" height="40"></td></tr></table></td></tr></table>', N'{{platformName}}', N'Minimal white header with centered logo', 1, CAST(N'2025-10-30T20:44:22.060' AS DateTime), CAST(N'2025-10-30T20:44:22.060' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (2, N'footer', N'Default Footer', N'<div style="background:#f8f9fa;padding:30px 20px;text-align:center;border-top:1px solid #e9ecef"><p style="color:#6c757d;margin:0 0 10px;font-size:14px">Need help? <a href="mailto:support@{{platformUrl}}" style="color:#667eea">support@{{platformUrl}}</a></p><p style="color:#adb5bd;margin:10px 0;font-size:12px">© {{currentYear}} {{platformName}}. All rights reserved.</p><p style="margin:15px 0 0;font-size:11px"><a href="{{unsubscribeUrl}}" style="color:#adb5bd;text-decoration:underline">Unsubscribe</a> | <a href="{{preferencesUrl}}" style="color:#adb5bd;text-decoration:underline">Manage Preferences</a></p></div>', N'© {{currentYear}} {{platformName}}. Contact: support@{{platformUrl}} | Unsubscribe: {{unsubscribeUrl}}', N'Default footer with unsubscribe', 1, CAST(N'2025-10-30T20:44:22.067' AS DateTime), CAST(N'2025-10-30T20:44:22.067' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (3, N'body', N'2FA Code', N'<div style="padding:40px 20px;background:white"><h2 style="color:#333;margin:0 0 20px">Verification Code</h2><p style="color:#666;margin:0 0 20px">Hello {{userName}},</p><p style="color:#666;margin:0 0 30px">Your verification code is:</p><div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:20px;border-radius:8px;text-align:center;margin:0 0 30px"><span style="color:white;font-size:32px;font-weight:bold;letter-spacing:8px">{{code}}</span></div><p style="color:#666;margin:0">Expires in <strong>10 minutes</strong>.</p></div>', N'Your code: {{code}}. Expires in 10 minutes.', N'2FA verification', 1, CAST(N'2025-10-30T20:44:22.070' AS DateTime), CAST(N'2025-10-30T20:44:22.070' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (4, N'body', N'Booking Request', N'<div style="padding:40px 20px;background:white"><h2 style="color:#333;margin:0 0 20px">New Booking Request</h2><p style="color:#666;margin:0 0 20px">Hello {{vendorName}},</p><p style="color:#666;margin:0 0 30px">New request from <strong>{{clientName}}</strong>.</p><div style="background:#f8f9fa;padding:20px;border-radius:8px;border-left:4px solid #667eea;margin:0 0 30px"><h3 style="color:#333;margin:0 0 15px;font-size:16px">Event Details</h3><p style="margin:5px 0"><strong>Service:</strong> {{serviceName}}</p><p style="margin:5px 0"><strong>Date:</strong> {{eventDate}}</p><p style="margin:5px 0"><strong>Location:</strong> {{location}}</p><p style="margin:5px 0"><strong>Budget:</strong> {{budget}}</p></div><p style="text-align:center;margin:0"><a href="{{dashboardUrl}}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:600">View Request</a></p></div>', N'New request from {{clientName}}. Service: {{serviceName}}, Date: {{eventDate}}. View: {{dashboardUrl}}', N'Booking request for vendor', 1, CAST(N'2025-10-30T20:44:22.077' AS DateTime), CAST(N'2025-10-30T20:44:22.077' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (5, N'body', N'Booking Accepted', N'<div style="padding:40px 20px;background:white"><h2 style="color:#28a745;margin:0 0 20px">? Booking Accepted!</h2><p style="color:#666;margin:0 0 20px">Hello {{clientName}},</p><p style="color:#666;margin:0 0 30px"><strong>{{vendorName}}</strong> accepted your request for <strong>{{serviceName}}</strong>!</p><div style="background:#d4edda;padding:20px;border-radius:8px;border-left:4px solid #28a745;margin:0 0 30px"><h3 style="color:#155724;margin:0 0 15px;font-size:16px">Next Steps</h3><p style="color:#155724;margin:5px 0">• Review booking details</p><p style="color:#155724;margin:5px 0">• Complete payment</p><p style="color:#155724;margin:5px 0">• Message vendor</p></div><p style="text-align:center;margin:0"><a href="{{dashboardUrl}}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:600">View Booking</a></p></div>', N'{{vendorName}} accepted your request for {{serviceName}}! View: {{dashboardUrl}}', N'Booking accepted notification', 1, CAST(N'2025-10-30T20:44:22.080' AS DateTime), CAST(N'2025-10-30T20:44:22.080' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (6, N'body', N'Booking Rejected', N'<div style="padding:40px 20px;background:white"><h2 style="color:#dc3545;margin:0 0 20px">Booking Update</h2><p style="color:#666;margin:0 0 20px">Hello {{clientName}},</p><p style="color:#666;margin:0 0 30px"><strong>{{vendorName}}</strong> cannot accept your request for <strong>{{serviceName}}</strong> on {{eventDate}}.</p><p style="color:#666;margin:0 0 30px">Many other vendors can help make your event amazing!</p><p style="text-align:center;margin:0"><a href="{{searchUrl}}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:600">Find Vendors</a></p></div>', N'{{vendorName}} cannot accept your request. Find other vendors: {{searchUrl}}', N'Booking rejected notification', 1, CAST(N'2025-10-30T20:44:22.083' AS DateTime), CAST(N'2025-10-30T20:44:22.083' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (7, N'body', N'Message From Vendor', N'<div style="padding:40px 20px;background:white"><h2 style="color:#333;margin:0 0 20px">New Message from {{vendorName}}</h2><p style="color:#666;margin:0 0 20px">Hello {{clientName}},</p><div style="background:#f8f9fa;padding:20px;border-radius:8px;border-left:4px solid #667eea;margin:0 0 30px"><p style="color:#333;margin:0">{{messageContent}}</p></div><p style="text-align:center;margin:0"><a href="{{dashboardUrl}}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:600">Reply</a></p></div>', N'Message from {{vendorName}}: {{messageContent}}. Reply: {{dashboardUrl}}', N'Message from vendor', 1, CAST(N'2025-10-30T20:44:22.087' AS DateTime), CAST(N'2025-10-30T20:44:22.087' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (8, N'body', N'Message From Client', N'<div style="padding:40px 20px;background:white"><h2 style="color:#333;margin:0 0 20px">New Message from {{clientName}}</h2><p style="color:#666;margin:0 0 20px">Hello {{vendorName}},</p><div style="background:#f8f9fa;padding:20px;border-radius:8px;border-left:4px solid #667eea;margin:0 0 30px"><p style="color:#333;margin:0">{{messageContent}}</p></div><p style="text-align:center;margin:0"><a href="{{dashboardUrl}}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:600">Reply</a></p></div>', N'Message from {{clientName}}: {{messageContent}}. Reply: {{dashboardUrl}}', N'Message from client', 1, CAST(N'2025-10-30T20:44:22.090' AS DateTime), CAST(N'2025-10-30T20:44:22.090' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (9, N'body', N'Payment Received', N'<div style="padding:40px 20px;background:white"><h2 style="color:#28a745;margin:0 0 20px">?? Payment Received</h2><p style="color:#666;margin:0 0 20px">Hello {{vendorName}},</p><p style="color:#666;margin:0 0 30px">Payment from <strong>{{clientName}}</strong>.</p><div style="background:#d4edda;padding:20px;border-radius:8px;border-left:4px solid #28a745;margin:0 0 30px"><h3 style="color:#155724;margin:0 0 15px;font-size:16px">Details</h3><p style="color:#155724;margin:5px 0;font-size:20px;font-weight:600"><strong>Amount:</strong> {{amount}}</p><p style="color:#155724;margin:5px 0"><strong>Service:</strong> {{serviceName}}</p><p style="color:#155724;margin:5px 0"><strong>Event:</strong> {{eventDate}}</p></div><p style="text-align:center;margin:0"><a href="{{dashboardUrl}}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:600">View Payment</a></p></div>', N'Payment received: {{amount}} for {{serviceName}}. View: {{dashboardUrl}}', N'Payment received notification', 1, CAST(N'2025-10-30T20:44:22.097' AS DateTime), CAST(N'2025-10-30T20:44:22.097' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (10, N'header', N'Default Header', N'<div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 20px;text-align:center"><h1 style="color:white;margin:0;font-size:28px;font-weight:600">{{platformName}}</h1><p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:14px">Connecting you with amazing vendors</p></div>', N'{{platformName}} - Connecting you with amazing vendors', N'Default header with gradient', 1, CAST(N'2025-11-26T01:05:11.057' AS DateTime), CAST(N'2025-11-26T01:05:11.057' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (11, N'footer', N'Default Footer', N'<div style="background:#f8f9fa;padding:30px 20px;text-align:center;border-top:1px solid #e9ecef"><p style="color:#6c757d;margin:0 0 10px;font-size:14px">Need help? <a href="mailto:support@{{platformUrl}}" style="color:#667eea">support@{{platformUrl}}</a></p><p style="color:#adb5bd;margin:10px 0;font-size:12px">© {{currentYear}} {{platformName}}. All rights reserved.</p><p style="margin:15px 0 0;font-size:11px"><a href="{{unsubscribeUrl}}" style="color:#adb5bd;text-decoration:underline">Unsubscribe</a> | <a href="{{preferencesUrl}}" style="color:#adb5bd;text-decoration:underline">Manage Preferences</a></p></div>', N'© {{currentYear}} {{platformName}}. Contact: support@{{platformUrl}} | Unsubscribe: {{unsubscribeUrl}}', N'Default footer with unsubscribe', 1, CAST(N'2025-11-26T01:05:11.087' AS DateTime), CAST(N'2025-11-26T01:05:11.087' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (12, N'body', N'2FA Code', N'<div style="padding:40px 20px;background:white"><h2 style="color:#333;margin:0 0 20px">Verification Code</h2><p style="color:#666;margin:0 0 20px">Hello {{userName}},</p><p style="color:#666;margin:0 0 30px">Your verification code is:</p><div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:20px;border-radius:8px;text-align:center;margin:0 0 30px"><span style="color:white;font-size:32px;font-weight:bold;letter-spacing:8px">{{code}}</span></div><p style="color:#666;margin:0">Expires in <strong>10 minutes</strong>.</p></div>', N'Your code: {{code}}. Expires in 10 minutes.', N'2FA verification', 1, CAST(N'2025-11-26T01:05:11.093' AS DateTime), CAST(N'2025-11-26T01:05:11.093' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (13, N'body', N'Booking Request', N'<div style="padding:40px 20px;background:white"><h2 style="color:#333;margin:0 0 20px">New Booking Request</h2><p style="color:#666;margin:0 0 20px">Hello {{vendorName}},</p><p style="color:#666;margin:0 0 30px">New request from <strong>{{clientName}}</strong>.</p><div style="background:#f8f9fa;padding:20px;border-radius:8px;border-left:4px solid #667eea;margin:0 0 30px"><h3 style="color:#333;margin:0 0 15px;font-size:16px">Event Details</h3><p style="margin:5px 0"><strong>Service:</strong> {{serviceName}}</p><p style="margin:5px 0"><strong>Date:</strong> {{eventDate}}</p><p style="margin:5px 0"><strong>Location:</strong> {{location}}</p><p style="margin:5px 0"><strong>Budget:</strong> {{budget}}</p></div><p style="text-align:center;margin:0"><a href="{{dashboardUrl}}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:600">View Request</a></p></div>', N'New request from {{clientName}}. Service: {{serviceName}}, Date: {{eventDate}}. View: {{dashboardUrl}}', N'Booking request for vendor', 1, CAST(N'2025-11-26T01:05:11.097' AS DateTime), CAST(N'2025-11-26T01:05:11.097' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (14, N'body', N'Booking Accepted', N'<div style="padding:40px 20px;background:white"><h2 style="color:#28a745;margin:0 0 20px">âœ“ Booking Accepted!</h2><p style="color:#666;margin:0 0 20px">Hello {{clientName}},</p><p style="color:#666;margin:0 0 30px"><strong>{{vendorName}}</strong> accepted your request for <strong>{{serviceName}}</strong>!</p><div style="background:#d4edda;padding:20px;border-radius:8px;border-left:4px solid #28a745;margin:0 0 30px"><h3 style="color:#155724;margin:0 0 15px;font-size:16px">Next Steps</h3><p style="color:#155724;margin:5px 0">â€¢ Review booking details</p><p style="color:#155724;margin:5px 0">â€¢ Complete payment</p><p style="color:#155724;margin:5px 0">â€¢ Message vendor</p></div><p style="text-align:center;margin:0"><a href="{{dashboardUrl}}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:600">View Booking</a></p></div>', N'{{vendorName}} accepted your request for {{serviceName}}! View: {{dashboardUrl}}', N'Booking accepted notification', 1, CAST(N'2025-11-26T01:05:11.100' AS DateTime), CAST(N'2025-11-26T01:05:11.100' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (15, N'body', N'Booking Rejected', N'<div style="padding:40px 20px;background:white"><h2 style="color:#dc3545;margin:0 0 20px">Booking Update</h2><p style="color:#666;margin:0 0 20px">Hello {{clientName}},</p><p style="color:#666;margin:0 0 30px"><strong>{{vendorName}}</strong> cannot accept your request for <strong>{{serviceName}}</strong> on {{eventDate}}.</p><p style="color:#666;margin:0 0 30px">Many other vendors can help make your event amazing!</p><p style="text-align:center;margin:0"><a href="{{searchUrl}}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:600">Find Vendors</a></p></div>', N'{{vendorName}} cannot accept your request. Find other vendors: {{searchUrl}}', N'Booking rejected notification', 1, CAST(N'2025-11-26T01:05:11.107' AS DateTime), CAST(N'2025-11-26T01:05:11.107' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (16, N'body', N'Message From Vendor', N'<div style="padding:40px 20px;background:white"><h2 style="color:#333;margin:0 0 20px">New Message from {{vendorName}}</h2><p style="color:#666;margin:0 0 20px">Hello {{clientName}},</p><div style="background:#f8f9fa;padding:20px;border-radius:8px;border-left:4px solid #667eea;margin:0 0 30px"><p style="color:#333;margin:0">{{messageContent}}</p></div><p style="text-align:center;margin:0"><a href="{{dashboardUrl}}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:600">Reply</a></p></div>', N'Message from {{vendorName}}: {{messageContent}}. Reply: {{dashboardUrl}}', N'Message from vendor', 1, CAST(N'2025-11-26T01:05:11.110' AS DateTime), CAST(N'2025-11-26T01:05:11.110' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (17, N'body', N'Message From Client', N'<div style="padding:40px 20px;background:white"><h2 style="color:#333;margin:0 0 20px">New Message from {{clientName}}</h2><p style="color:#666;margin:0 0 20px">Hello {{vendorName}},</p><div style="background:#f8f9fa;padding:20px;border-radius:8px;border-left:4px solid #667eea;margin:0 0 30px"><p style="color:#333;margin:0">{{messageContent}}</p></div><p style="text-align:center;margin:0"><a href="{{dashboardUrl}}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:600">Reply</a></p></div>', N'Message from {{clientName}}: {{messageContent}}. Reply: {{dashboardUrl}}', N'Message from client', 1, CAST(N'2025-11-26T01:05:11.117' AS DateTime), CAST(N'2025-11-26T01:05:11.117' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (18, N'body', N'Payment Received', N'<div style="padding:40px 20px;background:white"><h2 style="color:#28a745;margin:0 0 20px">ðŸ'° Payment Received</h2><p style="color:#666;margin:0 0 20px">Hello {{vendorName}},</p><p style="color:#666;margin:0 0 30px">Payment from <strong>{{clientName}}</strong>.</p><div style="background:#d4edda;padding:20px;border-radius:8px;border-left:4px solid #28a745;margin:0 0 30px"><h3 style="color:#155724;margin:0 0 15px;font-size:16px">Details</h3><p style="color:#155724;margin:5px 0;font-size:20px;font-weight:600"><strong>Amount:</strong> {{amount}}</p><p style="color:#155724;margin:5px 0"><strong>Service:</strong> {{serviceName}}</p><p style="color:#155724;margin:5px 0"><strong>Event:</strong> {{eventDate}}</p></div><p style="text-align:center;margin:0"><a href="{{dashboardUrl}}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:600">View Payment</a></p></div>', N'Payment received: {{amount}} for {{serviceName}}. View: {{dashboardUrl}}', N'Payment received notification', 1, CAST(N'2025-11-26T01:05:11.120' AS DateTime), CAST(N'2025-11-26T01:05:11.120' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (19, N'body', N'Payment Confirmation Client', N'<div style="padding:40px 20px;background:white"><h2 style="color:#28a745;margin:0 0 20px">✓ Payment Successful</h2><p style="color:#666;margin:0 0 20px">Hello {{clientName}},</p><p style="color:#666;margin:0 0 30px">Your payment to <strong>{{vendorName}}</strong> has been processed successfully.</p><div style="background:#d4edda;padding:20px;border-radius:8px;border-left:4px solid #28a745;margin:0 0 30px"><h3 style="color:#155724;margin:0 0 15px;font-size:16px">Payment Details</h3><p style="color:#155724;margin:5px 0;font-size:20px;font-weight:600"><strong>Amount:</strong> {{amount}}</p><p style="color:#155724;margin:5px 0"><strong>Service:</strong> {{serviceName}}</p><p style="color:#155724;margin:5px 0"><strong>Event Date:</strong> {{eventDate}}</p></div><p style="text-align:center;margin:0"><a href="{{dashboardUrl}}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:600">View Booking</a></p></div>', N'Payment of {{amount}} to {{vendorName}} for {{serviceName}} was successful. View: {{dashboardUrl}}', N'Payment confirmation for client', 1, CAST(N'2025-01-14T12:00:00.000' AS DateTime), CAST(N'2025-01-14T12:00:00.000' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (20, N'body', N'Booking Cancelled Client', N'<div style="padding:40px 20px;background:white"><h2 style="color:#dc3545;margin:0 0 20px">Booking Cancelled</h2><p style="color:#666;margin:0 0 20px">Hello {{clientName}},</p><p style="color:#666;margin:0 0 30px">Unfortunately, <strong>{{vendorName}}</strong> has cancelled your booking for <strong>{{serviceName}}</strong> on {{eventDate}}.</p><div style="background:#f8d7da;padding:20px;border-radius:8px;border-left:4px solid #dc3545;margin:0 0 30px"><h3 style="color:#721c24;margin:0 0 15px;font-size:16px">Cancellation Details</h3><p style="color:#721c24;margin:5px 0"><strong>Reason:</strong> {{reason}}</p><p style="color:#721c24;margin:5px 0"><strong>Refund Amount:</strong> {{refundAmount}}</p></div><p style="color:#666;margin:0 0 30px">We apologize for the inconvenience. Many other amazing vendors are available to help make your event special!</p><p style="text-align:center;margin:0"><a href="{{searchUrl}}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:600">Find Other Vendors</a></p></div>', N'{{vendorName}} cancelled your booking for {{serviceName}}. Reason: {{reason}}. Refund: {{refundAmount}}. Find other vendors: {{searchUrl}}', N'Booking cancelled notification for client', 1, CAST(N'2025-01-14T12:00:00.000' AS DateTime), CAST(N'2025-01-14T12:00:00.000' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (21, N'body', N'Booking Cancelled Vendor', N'<div style="padding:40px 20px;background:white"><h2 style="color:#dc3545;margin:0 0 20px">Booking Cancelled</h2><p style="color:#666;margin:0 0 20px">Hello {{vendorName}},</p><p style="color:#666;margin:0 0 30px"><strong>{{clientName}}</strong> has cancelled their booking for <strong>{{serviceName}}</strong> on {{eventDate}}.</p><div style="background:#f8d7da;padding:20px;border-radius:8px;border-left:4px solid #dc3545;margin:0 0 30px"><h3 style="color:#721c24;margin:0 0 15px;font-size:16px">Cancellation Details</h3><p style="color:#721c24;margin:5px 0"><strong>Reason:</strong> {{reason}}</p></div><p style="text-align:center;margin:0"><a href="{{dashboardUrl}}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:600">View Dashboard</a></p></div>', N'{{clientName}} cancelled their booking for {{serviceName}}. Reason: {{reason}}. View: {{dashboardUrl}}', N'Booking cancelled notification for vendor', 1, CAST(N'2025-01-14T12:00:00.000' AS DateTime), CAST(N'2025-01-14T12:00:00.000' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (22, N'body', N'Vendor Application Admin', N'<div style="padding:40px 20px;background:white"><h2 style="color:#667eea;margin:0 0 20px">New Vendor Application</h2><p style="color:#666;margin:0 0 30px">A new vendor has submitted an application to join {{platformName}}.</p><div style="background:#e8f4fd;padding:20px;border-radius:8px;border-left:4px solid #667eea;margin:0 0 30px"><h3 style="color:#0c5460;margin:0 0 15px;font-size:16px">Applicant Details</h3><p style="color:#0c5460;margin:5px 0"><strong>Name:</strong> {{applicantName}}</p><p style="color:#0c5460;margin:5px 0"><strong>Business Name:</strong> {{businessName}}</p><p style="color:#0c5460;margin:5px 0"><strong>Email:</strong> {{businessEmail}}</p><p style="color:#0c5460;margin:5px 0"><strong>Phone:</strong> {{businessPhone}}</p><p style="color:#0c5460;margin:5px 0"><strong>Category:</strong> {{category}}</p></div><p style="text-align:center;margin:0"><a href="{{dashboardUrl}}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:600">Review Application</a></p></div>', N'New vendor application from {{applicantName}} ({{businessName}}). Email: {{businessEmail}}, Phone: {{businessPhone}}, Category: {{category}}. Review: {{dashboardUrl}}', N'Vendor application notification for admin', 1, CAST(N'2025-01-14T12:00:00.000' AS DateTime), CAST(N'2025-01-14T12:00:00.000' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (23, N'body', N'Vendor Welcome', N'<div style="padding:40px 20px;background:white"><h2 style="color:#28a745;margin:0 0 20px">Welcome to {{platformName}}!</h2><p style="color:#666;margin:0 0 20px">Hello {{vendorName}},</p><p style="color:#666;margin:0 0 30px">Thank you for joining {{platformName}}! Your vendor application for <strong>{{businessName}}</strong> has been received.</p><div style="background:#d4edda;padding:20px;border-radius:8px;border-left:4px solid #28a745;margin:0 0 30px"><h3 style="color:#155724;margin:0 0 15px;font-size:16px">Next Steps</h3><p style="color:#155724;margin:5px 0">• Complete your vendor profile</p><p style="color:#155724;margin:5px 0">• Add your services and pricing</p><p style="color:#155724;margin:5px 0">• Upload photos of your work</p><p style="color:#155724;margin:5px 0">• Connect your Stripe account for payments</p></div><p style="text-align:center;margin:0"><a href="{{dashboardUrl}}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:600">Complete Your Profile</a></p></div>', N'Welcome to {{platformName}}! Complete your vendor profile for {{businessName}} at {{dashboardUrl}}', N'Welcome email for new vendors', 1, CAST(N'2025-01-14T12:00:00.000' AS DateTime), CAST(N'2025-01-14T12:00:00.000' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (24, N'body', N'Booking Confirmed Client', N'<div style="padding:40px 20px;background:white"><h2 style="color:#28a745;margin:0 0 20px">✓ Booking Confirmed!</h2><p style="color:#666;margin:0 0 20px">Hello {{clientName}},</p><p style="color:#666;margin:0 0 30px">Great news! Your booking with <strong>{{vendorName}}</strong> is now confirmed.</p><div style="background:#d4edda;padding:20px;border-radius:8px;border-left:4px solid #28a745;margin:0 0 30px"><h3 style="color:#155724;margin:0 0 15px;font-size:16px">Booking Details</h3><p style="color:#155724;margin:5px 0"><strong>Service:</strong> {{serviceName}}</p><p style="color:#155724;margin:5px 0"><strong>Date:</strong> {{eventDate}}</p><p style="color:#155724;margin:5px 0"><strong>Location:</strong> {{eventLocation}}</p></div><p style="text-align:center;margin:0"><a href="{{dashboardUrl}}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:600">View Booking</a></p></div>', N'Your booking with {{vendorName}} for {{serviceName}} on {{eventDate}} is confirmed! View: {{dashboardUrl}}', N'Booking confirmed notification for client', 1, CAST(N'2025-01-14T12:00:00.000' AS DateTime), CAST(N'2025-01-14T12:00:00.000' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (25, N'body', N'Booking Confirmed Vendor', N'<div style="padding:40px 20px;background:white"><h2 style="color:#28a745;margin:0 0 20px">✓ New Confirmed Booking!</h2><p style="color:#666;margin:0 0 20px">Hello {{vendorName}},</p><p style="color:#666;margin:0 0 30px">Great news! <strong>{{clientName}}</strong> has completed payment and your booking is now confirmed.</p><div style="background:#d4edda;padding:20px;border-radius:8px;border-left:4px solid #28a745;margin:0 0 30px"><h3 style="color:#155724;margin:0 0 15px;font-size:16px">Booking Details</h3><p style="color:#155724;margin:5px 0"><strong>Client:</strong> {{clientName}}</p><p style="color:#155724;margin:5px 0"><strong>Service:</strong> {{serviceName}}</p><p style="color:#155724;margin:5px 0"><strong>Date:</strong> {{eventDate}}</p><p style="color:#155724;margin:5px 0"><strong>Location:</strong> {{eventLocation}}</p></div><p style="text-align:center;margin:0"><a href="{{dashboardUrl}}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:600">View Booking</a></p></div>', N'New confirmed booking from {{clientName}} for {{serviceName}} on {{eventDate}}. View: {{dashboardUrl}}', N'Booking confirmed notification for vendor', 1, CAST(N'2025-01-14T12:00:00.000' AS DateTime), CAST(N'2025-01-14T12:00:00.000' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (26, N'body', N'Vendor Approved', N'<div style="padding:40px 20px;background:white"><h2 style="color:#28a745;margin:0 0 20px">Congratulations! Your Profile is Approved!</h2><p style="color:#666;margin:0 0 20px">Hello {{vendorName}},</p><p style="color:#666;margin:0 0 30px">Great news! Your vendor profile for <strong>{{businessName}}</strong> has been approved and is now live on {{platformName}}.</p><div style="background:#d4edda;padding:20px;border-radius:8px;border-left:4px solid #28a745;margin:0 0 30px"><h3 style="color:#155724;margin:0 0 15px;font-size:16px">What happens next?</h3><p style="color:#155724;margin:5px 0">Your profile is now visible to clients</p><p style="color:#155724;margin:5px 0">You can start receiving booking requests</p><p style="color:#155724;margin:5px 0">Make sure your services and pricing are up to date</p></div><p style="text-align:center;margin:0"><a href="{{dashboardUrl}}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:600">Go to Dashboard</a></p></div>', N'Your vendor profile for {{businessName}} has been approved! Go to {{dashboardUrl}}', N'Vendor profile approved notification', 1, CAST(N'2025-01-14T12:00:00.000' AS DateTime), CAST(N'2025-01-14T12:00:00.000' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (27, N'body', N'Vendor Rejected', N'<div style="padding:40px 20px;background:white"><h2 style="color:#dc3545;margin:0 0 20px">Profile Review Update</h2><p style="color:#666;margin:0 0 20px">Hello {{vendorName}},</p><p style="color:#666;margin:0 0 30px">We have reviewed your vendor profile for <strong>{{businessName}}</strong> and unfortunately we are unable to approve it at this time.</p><div style="background:#f8d7da;padding:20px;border-radius:8px;border-left:4px solid #dc3545;margin:0 0 30px"><h3 style="color:#721c24;margin:0 0 15px;font-size:16px">Reason</h3><p style="color:#721c24;margin:5px 0">{{rejectionReason}}</p></div><p style="color:#666;margin:0 0 30px">You can update your profile and resubmit for review. If you have any questions, please contact our support team.</p><p style="text-align:center;margin:0"><a href="{{dashboardUrl}}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:600">Update Profile</a></p></div>', N'Your vendor profile for {{businessName}} was not approved. Reason: {{rejectionReason}}. Update at {{dashboardUrl}}', N'Vendor profile rejected notification', 1, CAST(N'2025-01-14T12:00:00.000' AS DateTime), CAST(N'2025-01-14T12:00:00.000' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (28, N'body', N'Client Welcome', N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7"><tr><td align="center" style="padding:0 20px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border:1px solid #ebebeb;border-top:none"><tr><td style="padding:40px"><h2 style="color:#667eea;margin:0 0 20px;text-align:center">Welcome to {{platformName}}!</h2><p style="color:#666;margin:0 0 20px">Hello {{clientName}},</p><p style="color:#666;margin:0 0 30px">Thank you for creating your account on {{platformName}}! We are excited to help you find amazing vendors for your events.</p><div style="background:#f0f4ff;padding:20px;border-radius:8px;border-left:4px solid #667eea;margin:0 0 30px"><h3 style="color:#4338ca;margin:0 0 15px;font-size:16px">What you can do now:</h3><p style="color:#4338ca;margin:5px 0">• Browse and discover amazing vendors</p><p style="color:#4338ca;margin:5px 0">• Save your favorites for later</p><p style="color:#4338ca;margin:5px 0">• Send booking requests directly</p><p style="color:#4338ca;margin:5px 0">• Manage all your events in one place</p></div><p style="text-align:center;margin:0"><a href="{{searchUrl}}" style="display:inline-block;background:#222222;color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:600">Start Exploring</a></p></td></tr></table></td></tr></table>', N'Welcome to {{platformName}}! Start exploring vendors at {{searchUrl}}', N'Welcome email for new clients', 1, CAST(N'2025-01-17T12:00:00.000' AS DateTime), CAST(N'2025-01-17T12:00:00.000' AS DateTime));
    INSERT [admin].[EmailTemplateComponents] ([ComponentID], [ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (29, N'body', N'Client to Vendor Welcome', N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7"><tr><td align="center" style="padding:0 20px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border:1px solid #ebebeb;border-top:none"><tr><td style="padding:40px"><h2 style="color:#28a745;margin:0 0 20px;text-align:center">You are Now a Vendor!</h2><p style="color:#666;margin:0 0 20px">Hello {{vendorName}},</p><p style="color:#666;margin:0 0 30px">Congratulations! You have successfully registered as a vendor on {{platformName}}. Your business <strong>{{businessName}}</strong> is now set up and ready to start receiving bookings.</p><div style="background:#d4edda;padding:20px;border-radius:8px;border-left:4px solid #28a745;margin:0 0 30px"><h3 style="color:#155724;margin:0 0 15px;font-size:16px">Next Steps:</h3><p style="color:#155724;margin:5px 0">• Complete your vendor profile</p><p style="color:#155724;margin:5px 0">• Add your services and pricing</p><p style="color:#155724;margin:5px 0">• Upload photos of your work</p><p style="color:#155724;margin:5px 0">• Connect your Stripe account for payments</p></div><p style="text-align:center;margin:0"><a href="{{dashboardUrl}}" style="display:inline-block;background:#222222;color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:600">Complete Your Profile</a></p></td></tr></table></td></tr></table>', N'Congratulations! You are now a vendor on {{platformName}}. Complete your profile for {{businessName}} at {{dashboardUrl}}', N'Welcome email for clients who become vendors', 1, CAST(N'2025-01-17T12:00:00.000' AS DateTime), CAST(N'2025-01-17T12:00:00.000' AS DateTime));

    SET IDENTITY_INSERT [admin].[EmailTemplateComponents] OFF;

    PRINT 'Inserted 29 records into [admin].[EmailTemplateComponents].';
END
ELSE
BEGIN
    PRINT 'Table [admin].[EmailTemplateComponents] already contains data. Updating with white background, app theme styling...';
    
    -- Update Headers (ComponentID 1, 10) - Clean white background matching app theme
    UPDATE [admin].[EmailTemplateComponents]
    SET [HtmlContent] = N'<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#ffffff;font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff"><tr><td align="center" style="padding:48px 24px 32px 24px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px"><tr><td align="center"><a href="{{frontendUrl}}" style="text-decoration:none"><img src="{{logoUrl}}" alt="{{platformName}}" style="height:32px;width:auto;display:block" height="32"></a></td></tr></table></td></tr></table>',
        [TextContent] = N'{{platformName}}',
        [Description] = N'Clean white header matching app theme',
        [UpdatedAt] = GETDATE()
    WHERE [ComponentID] IN (1, 10);

    -- Update Footers (ComponentID 2, 11) - Add unsubscribe and preferences links
    UPDATE [admin].[EmailTemplateComponents]
    SET [HtmlContent] = N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7"><tr><td align="center" style="padding:0 20px 40px 20px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border:1px solid #ebebeb;border-top:none;border-radius:0 0 8px 8px"><tr><td align="center" style="padding:40px;border-top:1px solid #ebebeb"><a href="{{frontendUrl}}" style="text-decoration:none"><img src="{{logoUrl}}" alt="{{platformName}}" style="height:28px;width:auto;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto" height="28"></a><p style="color:#717171;font-size:14px;line-height:20px;margin:0 0 16px 0;text-align:center">The easiest way to find amazing vendors for your events.</p><table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 20px auto"><tr><td style="padding:0 12px"><a href="https://instagram.com/planbeau" style="color:#222222;text-decoration:none;font-size:13px;font-weight:500">Instagram</a></td><td style="padding:0 12px;border-left:1px solid #ebebeb"><a href="https://facebook.com/planbeau" style="color:#222222;text-decoration:none;font-size:13px;font-weight:500">Facebook</a></td><td style="padding:0 12px;border-left:1px solid #ebebeb"><a href="https://twitter.com/planbeau" style="color:#222222;text-decoration:none;font-size:13px;font-weight:500">X</a></td></tr></table><p style="color:#717171;font-size:12px;line-height:18px;margin:0 0 8px 0;text-align:center">{{platformName}} Inc., Toronto, ON, Canada</p><p style="color:#717171;font-size:12px;line-height:18px;margin:0 0 16px 0;text-align:center"><a href="mailto:support@planbeau.com" style="color:#717171;text-decoration:underline">support@planbeau.com</a></p><table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 16px auto"><tr><td style="padding:0 8px"><a href="{{unsubscribeUrl}}" style="color:#717171;text-decoration:underline;font-size:12px">Unsubscribe</a></td><td style="padding:0 8px;border-left:1px solid #ebebeb"><a href="{{preferencesUrl}}" style="color:#717171;text-decoration:underline;font-size:12px">Manage Preferences</a></td></tr></table><p style="color:#b0b0b0;font-size:11px;line-height:16px;margin:0;text-align:center">© {{currentYear}} {{platformName}}. All rights reserved.</p></td></tr></table></td></tr></table></body></html>',
        [TextContent] = N'---
{{platformName}} Inc., Toronto, ON, Canada
Contact: support@planbeau.com
Unsubscribe: {{unsubscribeUrl}}
Manage Preferences: {{preferencesUrl}}
© {{currentYear}} {{platformName}}. All rights reserved.',
        [Description] = N'Centered footer with unsubscribe and preferences links',
        [UpdatedAt] = GETDATE()
    WHERE [ComponentID] IN (2, 11);

    -- Update 2FA Code (ComponentID 3, 12)
    UPDATE [admin].[EmailTemplateComponents]
    SET [HtmlContent] = N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7"><tr><td align="center" style="padding:0 20px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border-left:1px solid #ebebeb;border-right:1px solid #ebebeb"><tr><td align="center" style="padding:40px"><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 24px 0;text-align:center">Verification Code</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0;text-align:center">Hello {{userName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 32px 0;text-align:center">Your verification code is:</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:24px 0;background-color:#f7f7f7;border-radius:12px"><span style="color:#222222;font-size:36px;font-weight:700;letter-spacing:8px">{{code}}</span></td></tr></table><p style="color:#717171;font-size:14px;line-height:20px;margin:24px 0 0 0;text-align:center">This code expires in <strong>10 minutes</strong>.</p></td></tr></table></td></tr></table>',
        [UpdatedAt] = GETDATE()
    WHERE [ComponentID] IN (3, 12);

    -- Update Booking Request (ComponentID 4, 13) - Updated to match booking card table style with client avatar
    UPDATE [admin].[EmailTemplateComponents]
    SET [HtmlContent] = N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7"><tr><td align="center" style="padding:0 20px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border-left:1px solid #ebebeb;border-right:1px solid #ebebeb"><tr><td style="padding:40px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px"><tr><td align="center"><div style="width:56px;height:56px;border-radius:50%;background-color:#10b981;display:inline-block;text-align:center;line-height:56px"><span style="font-size:24px">📅</span></div></td></tr></table><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 24px 0;text-align:center">New Booking Request</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{vendorName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 24px 0">You have received a new booking request.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7;border-radius:12px;margin-bottom:24px"><tr><td style="padding:20px"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="vertical-align:middle">{{clientAvatarHtml}}</td><td style="padding-left:12px;vertical-align:middle"><p style="color:#222222;font-size:16px;font-weight:600;margin:0">{{clientName}}</p><p style="color:#717171;font-size:13px;margin:4px 0 0 0">Client</p></td></tr></table></td></tr></table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e5e5e5;border-radius:8px;overflow:hidden"><tr><td style="padding:14px 18px;border-bottom:1px solid #f3f4f6"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="color:#6b7280;font-size:14px">Service</td><td style="color:#111111;font-size:14px;font-weight:500;text-align:right">{{serviceName}}</td></tr></table></td></tr><tr><td style="padding:14px 18px;border-bottom:1px solid #f3f4f6"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="color:#6b7280;font-size:14px">Location</td><td style="color:#111111;font-size:14px;font-weight:500;text-align:right">{{location}}</td></tr></table></td></tr><tr><td style="padding:14px 18px;border-bottom:1px solid #f3f4f6"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="color:#6b7280;font-size:14px">Date</td><td style="color:#111111;font-size:14px;font-weight:500;text-align:right;text-decoration:underline">{{eventDate}}</td></tr></table></td></tr><tr><td style="padding:14px 18px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="color:#6b7280;font-size:14px">Time</td><td style="color:#111111;font-size:14px;font-weight:500;text-align:right">{{eventTime}}</td></tr></table></td></tr></table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:32px 0 0 0"><a href="{{frontendUrl}}/dashboard?tab=bookings" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">View Request</a></td></tr></table></td></tr></table></td></tr></table>',
        [UpdatedAt] = GETDATE()
    WHERE [ComponentID] IN (4, 13);

    -- Update Booking Accepted (ComponentID 5, 14)
    UPDATE [admin].[EmailTemplateComponents]
    SET [HtmlContent] = N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7"><tr><td align="center" style="padding:0 20px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border-left:1px solid #ebebeb;border-right:1px solid #ebebeb"><tr><td style="padding:40px"><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 24px 0;text-align:center">Booking Accepted!</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{clientName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 32px 0">Great news! <strong>{{vendorName}}</strong> has accepted your booking request for <strong>{{serviceName}}</strong>.</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 24px 0;text-align:center">Complete your payment to finalize the booking.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:0"><a href="{{frontendUrl}}/dashboard?tab=bookings" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">Complete Payment</a></td></tr></table></td></tr></table></td></tr></table>',
        [UpdatedAt] = GETDATE()
    WHERE [ComponentID] IN (5, 14);

    -- Update Booking Rejected (ComponentID 6, 15)
    UPDATE [admin].[EmailTemplateComponents]
    SET [HtmlContent] = N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7"><tr><td align="center" style="padding:0 20px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border-left:1px solid #ebebeb;border-right:1px solid #ebebeb"><tr><td style="padding:40px"><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 24px 0;text-align:center">Booking Update</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{clientName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 24px 0">Unfortunately, <strong>{{vendorName}}</strong> is unable to accept your booking request for <strong>{{serviceName}}</strong> on {{eventDate}}.</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 24px 0;text-align:center">There are many other amazing vendors ready to help!</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:0"><a href="{{frontendUrl}}/explore" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">Find Other Vendors</a></td></tr></table></td></tr></table></td></tr></table>',
        [UpdatedAt] = GETDATE()
    WHERE [ComponentID] IN (6, 15);

    -- Update Message From Vendor (ComponentID 7, 16) - With profile pic support via senderAvatarHtml
    UPDATE [admin].[EmailTemplateComponents]
    SET [HtmlContent] = N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7"><tr><td align="center" style="padding:0 20px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border-left:1px solid #ebebeb;border-right:1px solid #ebebeb"><tr><td style="padding:40px"><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 24px 0;text-align:center">New Message</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{clientName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 24px 0">You have a new message from <strong>{{vendorName}}</strong>:</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7;border-radius:12px"><tr><td style="padding:24px"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="vertical-align:top">{{senderAvatarHtml}}</td><td style="padding-left:16px;vertical-align:top"><p style="color:#222222;font-size:15px;font-weight:600;margin:0">{{vendorName}}</p><p style="color:#717171;font-size:13px;margin:4px 0 0 0">{{messageTime}}</p></td></tr></table><p style="color:#484848;font-size:15px;line-height:24px;margin:16px 0 0 0;white-space:pre-wrap">{{messageContent}}</p></td></tr></table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:32px 0 0 0"><a href="{{frontendUrl}}/dashboard?tab=messages" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">Reply to Message</a></td></tr></table></td></tr></table></td></tr></table>',
        [UpdatedAt] = GETDATE()
    WHERE [ComponentID] IN (7, 16);

    -- Update Message From Client (ComponentID 8, 17) - With profile pic support via senderAvatarHtml
    UPDATE [admin].[EmailTemplateComponents]
    SET [HtmlContent] = N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7"><tr><td align="center" style="padding:0 20px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border-left:1px solid #ebebeb;border-right:1px solid #ebebeb"><tr><td style="padding:40px"><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 24px 0;text-align:center">New Message</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{vendorName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 24px 0">You have a new message from <strong>{{clientName}}</strong>:</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7;border-radius:12px"><tr><td style="padding:24px"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="vertical-align:top">{{senderAvatarHtml}}</td><td style="padding-left:16px;vertical-align:top"><p style="color:#222222;font-size:15px;font-weight:600;margin:0">{{clientName}}</p><p style="color:#717171;font-size:13px;margin:4px 0 0 0">{{messageTime}}</p></td></tr></table><p style="color:#484848;font-size:15px;line-height:24px;margin:16px 0 0 0;white-space:pre-wrap">{{messageContent}}</p></td></tr></table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:32px 0 0 0"><a href="{{frontendUrl}}/dashboard?tab=messages" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">Reply to Message</a></td></tr></table></td></tr></table></td></tr></table>',
        [UpdatedAt] = GETDATE()
    WHERE [ComponentID] IN (8, 17);

    -- Update Payment Received (ComponentID 9, 18)
    UPDATE [admin].[EmailTemplateComponents]
    SET [HtmlContent] = N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7"><tr><td align="center" style="padding:0 20px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border-left:1px solid #ebebeb;border-right:1px solid #ebebeb"><tr><td style="padding:40px"><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 24px 0;text-align:center">Payment Received</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{vendorName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 32px 0">You have received a payment of <strong>{{amount}}</strong> from <strong>{{clientName}}</strong> for {{serviceName}}.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:0"><a href="{{invoiceUrl}}" style="display:inline-block;background-color:#166534;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">View Invoice</a></td></tr></table></td></tr></table></td></tr></table>',
        [UpdatedAt] = GETDATE()
    WHERE [ComponentID] IN (9, 18);

    -- Update Payment Confirmation Client (ComponentID 19)
    UPDATE [admin].[EmailTemplateComponents]
    SET [HtmlContent] = N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7"><tr><td align="center" style="padding:0 20px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border-left:1px solid #ebebeb;border-right:1px solid #ebebeb"><tr><td style="padding:40px"><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 24px 0;text-align:center">Payment Successful</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{clientName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 32px 0">Your payment of <strong>{{amount}}</strong> to <strong>{{vendorName}}</strong> for {{serviceName}} has been processed successfully.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:0"><a href="{{invoiceUrl}}" style="display:inline-block;background-color:#166534;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">View Invoice</a></td></tr></table></td></tr></table></td></tr></table>',
        [UpdatedAt] = GETDATE()
    WHERE [ComponentID] = 19;

    -- Update Booking Cancelled Client (ComponentID 20)
    UPDATE [admin].[EmailTemplateComponents]
    SET [HtmlContent] = N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7"><tr><td align="center" style="padding:0 20px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border-left:1px solid #ebebeb;border-right:1px solid #ebebeb"><tr><td style="padding:40px"><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 24px 0;text-align:center">Booking Cancelled</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{clientName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 24px 0">Your booking with <strong>{{vendorName}}</strong> for {{serviceName}} on {{eventDate}} has been cancelled.</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 24px 0;text-align:center">There are many other amazing vendors ready to help!</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:0"><a href="{{frontendUrl}}/explore" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">Find Other Vendors</a></td></tr></table></td></tr></table></td></tr></table>',
        [UpdatedAt] = GETDATE()
    WHERE [ComponentID] = 20;

    -- Update Booking Cancelled Vendor (ComponentID 21)
    UPDATE [admin].[EmailTemplateComponents]
    SET [HtmlContent] = N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7"><tr><td align="center" style="padding:0 20px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border-left:1px solid #ebebeb;border-right:1px solid #ebebeb"><tr><td style="padding:40px"><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 24px 0;text-align:center">Booking Cancelled</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{vendorName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 32px 0"><strong>{{clientName}}</strong> has cancelled their booking for {{serviceName}} on {{eventDate}}.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:0"><a href="{{frontendUrl}}/dashboard?tab=bookings" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">View Dashboard</a></td></tr></table></td></tr></table></td></tr></table>',
        [UpdatedAt] = GETDATE()
    WHERE [ComponentID] = 21;

    -- Update Vendor Application Admin (ComponentID 22)
    UPDATE [admin].[EmailTemplateComponents]
    SET [HtmlContent] = N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7"><tr><td align="center" style="padding:0 20px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border-left:1px solid #ebebeb;border-right:1px solid #ebebeb"><tr><td style="padding:40px"><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 24px 0;text-align:center">New Vendor Application</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 32px 0;text-align:center">A new vendor has submitted an application to join {{platformName}}.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7;border-radius:12px"><tr><td style="padding:24px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="padding:8px 0;border-bottom:1px solid #ebebeb"><span style="color:#717171;font-size:14px">Name</span></td><td style="padding:8px 0;border-bottom:1px solid #ebebeb;text-align:right"><span style="color:#222222;font-size:14px;font-weight:500">{{applicantName}}</span></td></tr><tr><td style="padding:8px 0;border-bottom:1px solid #ebebeb"><span style="color:#717171;font-size:14px">Business</span></td><td style="padding:8px 0;border-bottom:1px solid #ebebeb;text-align:right"><span style="color:#222222;font-size:14px;font-weight:500">{{businessName}}</span></td></tr><tr><td style="padding:8px 0;border-bottom:1px solid #ebebeb"><span style="color:#717171;font-size:14px">Email</span></td><td style="padding:8px 0;border-bottom:1px solid #ebebeb;text-align:right"><span style="color:#222222;font-size:14px;font-weight:500">{{businessEmail}}</span></td></tr><tr><td style="padding:8px 0"><span style="color:#717171;font-size:14px">Category</span></td><td style="padding:8px 0;text-align:right"><span style="color:#222222;font-size:14px;font-weight:500">{{category}}</span></td></tr></table></td></tr></table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:32px 0 0 0"><a href="{{frontendUrl}}/admin/dashboard" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">Review Application</a></td></tr></table></td></tr></table></td></tr></table>',
        [UpdatedAt] = GETDATE()
    WHERE [ComponentID] = 22;

    -- Update Vendor Welcome (ComponentID 23)
    UPDATE [admin].[EmailTemplateComponents]
    SET [HtmlContent] = N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7"><tr><td align="center" style="padding:0 20px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border-left:1px solid #ebebeb;border-right:1px solid #ebebeb"><tr><td style="padding:40px"><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 24px 0;text-align:center">Welcome to {{platformName}}!</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{vendorName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 32px 0">Thank you for joining {{platformName}}! Your vendor application for <strong>{{businessName}}</strong> has been received and is under review.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7;border-radius:12px"><tr><td style="padding:24px"><p style="color:#222222;font-size:16px;font-weight:600;margin:0 0 16px 0">While You Wait</p><p style="color:#484848;font-size:14px;line-height:22px;margin:0 0 8px 0">1. Complete your vendor profile with photos</p><p style="color:#484848;font-size:14px;line-height:22px;margin:0 0 8px 0">2. Add your services and pricing</p><p style="color:#484848;font-size:14px;line-height:22px;margin:0 0 8px 0">3. Set your availability calendar</p><p style="color:#484848;font-size:14px;line-height:22px;margin:0">4. Connect your Stripe account</p></td></tr></table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:32px 0 0 0"><a href="{{frontendUrl}}/dashboard?tab=vendor-business-profile" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">Complete Your Profile</a></td></tr></table></td></tr></table></td></tr></table>',
        [UpdatedAt] = GETDATE()
    WHERE [ComponentID] = 23;

    -- Update Booking Confirmed Client (ComponentID 24)
    UPDATE [admin].[EmailTemplateComponents]
    SET [HtmlContent] = N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7"><tr><td align="center" style="padding:0 20px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border-left:1px solid #ebebeb;border-right:1px solid #ebebeb"><tr><td style="padding:40px"><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 24px 0;text-align:center">Booking Confirmed!</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{clientName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 32px 0">Great news! Your booking with <strong>{{vendorName}}</strong> for {{serviceName}} on {{eventDate}} is now confirmed.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:0"><a href="{{frontendUrl}}/dashboard?tab=bookings" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">View Booking</a></td></tr></table></td></tr></table></td></tr></table>',
        [UpdatedAt] = GETDATE()
    WHERE [ComponentID] = 24;

    -- Update Booking Confirmed Vendor (ComponentID 25)
    UPDATE [admin].[EmailTemplateComponents]
    SET [HtmlContent] = N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7"><tr><td align="center" style="padding:0 20px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border-left:1px solid #ebebeb;border-right:1px solid #ebebeb"><tr><td style="padding:40px"><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 24px 0;text-align:center">New Confirmed Booking!</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{vendorName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 32px 0"><strong>{{clientName}}</strong> has completed payment and your booking for {{serviceName}} on {{eventDate}} is now confirmed.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:0"><a href="{{frontendUrl}}/dashboard?tab=bookings" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">View Booking</a></td></tr></table></td></tr></table></td></tr></table>',
        [UpdatedAt] = GETDATE()
    WHERE [ComponentID] = 25;

    -- Update Vendor Approved (ComponentID 26)
    UPDATE [admin].[EmailTemplateComponents]
    SET [HtmlContent] = N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7"><tr><td align="center" style="padding:0 20px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border-left:1px solid #ebebeb;border-right:1px solid #ebebeb"><tr><td style="padding:40px"><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 24px 0;text-align:center">Your Profile is Approved!</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{vendorName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 32px 0">Congratulations! Your vendor profile for <strong>{{businessName}}</strong> has been approved and is now live on {{platformName}}.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:0"><a href="{{frontendUrl}}/dashboard" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">Go to Dashboard</a></td></tr></table></td></tr></table></td></tr></table>',
        [UpdatedAt] = GETDATE()
    WHERE [ComponentID] = 26;

    -- Update Vendor Rejected (ComponentID 27)
    UPDATE [admin].[EmailTemplateComponents]
    SET [HtmlContent] = N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7"><tr><td align="center" style="padding:0 20px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border-left:1px solid #ebebeb;border-right:1px solid #ebebeb"><tr><td style="padding:40px"><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 24px 0;text-align:center">Profile Review Update</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{vendorName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 24px 0">We have reviewed your vendor profile for <strong>{{businessName}}</strong> and unfortunately we are unable to approve it at this time.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7;border-radius:12px"><tr><td style="padding:24px"><p style="color:#222222;font-size:14px;font-weight:600;margin:0 0 8px 0">Reason</p><p style="color:#484848;font-size:14px;line-height:22px;margin:0">{{rejectionReason}}</p></td></tr></table><p style="color:#484848;font-size:14px;line-height:22px;margin:24px 0 0 0;text-align:center">You can update your profile and resubmit for review.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:24px 0 0 0"><a href="{{frontendUrl}}/dashboard?tab=vendor-business-profile" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">Update Profile</a></td></tr></table></td></tr></table></td></tr></table>',
        [UpdatedAt] = GETDATE()
    WHERE [ComponentID] = 27;

    PRINT 'Updated email template components with centered layout, correct URLs, unsubscribe links, and profile pic support.';
    
    -- Fix all templates to use white background instead of grey (#f7f7f7 -> #ffffff)
    UPDATE [admin].[EmailTemplateComponents]
    SET [HtmlContent] = REPLACE([HtmlContent], 'background-color:#f7f7f7', 'background-color:#ffffff'),
        [UpdatedAt] = GETDATE()
    WHERE [HtmlContent] LIKE '%background-color:#f7f7f7%';
    
    UPDATE [admin].[EmailTemplateComponents]
    SET [HtmlContent] = REPLACE([HtmlContent], 'background:#f7f7f7', 'background:#ffffff'),
        [UpdatedAt] = GETDATE()
    WHERE [HtmlContent] LIKE '%background:#f7f7f7%';
    
    PRINT 'Fixed email templates to use white background.';
    
    -- Add new email template components if they don't exist
    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'Event Reminder')
    BEGIN
        INSERT [admin].[EmailTemplateComponents] ([ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt])
        VALUES (N'body', N'Event Reminder', N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff"><tr><td align="center" style="padding:0 24px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px"><tr><td style="padding:32px 0"><div style="width:48px;height:48px;background:#f0fdf4;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px auto"><span style="font-size:24px">📅</span></div><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 16px 0;text-align:center">Event Reminder</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 24px 0;text-align:center">Hello {{recipientName}}, your event is coming up in <strong>{{daysUntilEvent}}</strong>!</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f9fafb;border-radius:12px;margin-bottom:24px"><tr><td style="padding:24px"><p style="margin:0 0 12px 0"><strong>Service:</strong> {{serviceName}}</p><p style="margin:0 0 12px 0"><strong>Date:</strong> {{eventDate}}</p><p style="margin:0 0 12px 0"><strong>Time:</strong> {{eventTime}}</p><p style="margin:0"><strong>Location:</strong> {{location}}</p></td></tr></table><p style="color:#484848;font-size:14px;margin:0 0 24px 0;text-align:center">{{otherPartyLabel}}: <strong>{{otherPartyName}}</strong></p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center"><a href="{{frontendUrl}}/dashboard?tab=bookings" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">View Booking</a></td></tr></table></td></tr></table></td></tr></table>', N'Event Reminder: Your {{serviceName}} is in {{daysUntilEvent}}. Date: {{eventDate}}, Location: {{location}}', N'Event reminder for upcoming bookings', 1, GETDATE(), GETDATE());
        PRINT 'Added Event Reminder component';
    END

    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'Booking Action Reminder')
    BEGIN
        INSERT [admin].[EmailTemplateComponents] ([ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt])
        VALUES (N'body', N'Booking Action Reminder', N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff"><tr><td align="center" style="padding:0 24px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px"><tr><td style="padding:32px 0"><div style="width:48px;height:48px;background:#fef3c7;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px auto"><span style="font-size:24px">⏰</span></div><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 16px 0;text-align:center">{{actionSubject}}</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{recipientName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 24px 0">{{actionMessage}}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f9fafb;border-radius:12px;margin-bottom:24px"><tr><td style="padding:24px"><p style="margin:0 0 12px 0"><strong>Service:</strong> {{serviceName}}</p><p style="margin:0 0 12px 0"><strong>Date:</strong> {{eventDate}}</p><p style="margin:0"><strong>{{otherPartyLabel}}:</strong> {{otherPartyName}}</p></td></tr></table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center"><a href="{{actionUrl}}" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">{{actionButtonText}}</a></td></tr></table></td></tr></table></td></tr></table>', N'{{actionSubject}}: {{actionMessage}}. Service: {{serviceName}}, Date: {{eventDate}}', N'Action reminder for pending bookings', 1, GETDATE(), GETDATE());
        PRINT 'Added Booking Action Reminder component';
    END

    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'Analytics Summary')
    BEGIN
        INSERT [admin].[EmailTemplateComponents] ([ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt])
        VALUES (N'body', N'Analytics Summary', N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff"><tr><td align="center" style="padding:0 24px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px"><tr><td style="padding:32px 0"><div style="width:48px;height:48px;background:#dbeafe;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px auto"><span style="font-size:24px">📊</span></div><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 16px 0;text-align:center">{{summaryPeriod}} Analytics Summary</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 8px 0;text-align:center">Hello {{recipientName}},</p><p style="color:#717171;font-size:14px;margin:0 0 24px 0;text-align:center">{{periodRange}}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px"><tr><td style="padding:16px;background:#f9fafb;border-radius:8px;text-align:center;width:33%"><div style="font-size:28px;font-weight:700;color:#222222">{{profileViews}}</div><div style="font-size:13px;color:#717171">Profile Views</div><div style="font-size:12px;color:#10b981">{{viewsChange}}</div></td><td style="width:8px"></td><td style="padding:16px;background:#f9fafb;border-radius:8px;text-align:center;width:33%"><div style="font-size:28px;font-weight:700;color:#222222">{{bookings}}</div><div style="font-size:13px;color:#717171">Bookings</div><div style="font-size:12px;color:#10b981">{{bookingsChange}}</div></td><td style="width:8px"></td><td style="padding:16px;background:#f9fafb;border-radius:8px;text-align:center;width:33%"><div style="font-size:28px;font-weight:700;color:#222222">{{revenue}}</div><div style="font-size:13px;color:#717171">Revenue</div><div style="font-size:12px;color:#10b981">{{revenueChange}}</div></td></tr></table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center"><a href="{{frontendUrl}}/dashboard?tab=analytics" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">View Full Analytics</a></td></tr></table></td></tr></table></td></tr></table>', N'{{summaryPeriod}} Analytics: {{profileViews}} views, {{bookings}} bookings, {{revenue}} revenue', N'Analytics summary for vendors', 1, GETDATE(), GETDATE());
        PRINT 'Added Analytics Summary component';
    END

    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'Account Suspended')
    BEGIN
        INSERT [admin].[EmailTemplateComponents] ([ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt])
        VALUES (N'body', N'Account Suspended', N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff"><tr><td align="center" style="padding:0 24px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px"><tr><td style="padding:32px 0"><div style="width:48px;height:48px;background:#fee2e2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px auto"><span style="font-size:24px">⚠️</span></div><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 16px 0;text-align:center">Account Suspended</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{recipientName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 24px 0">Your account has been temporarily suspended.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fef2f2;border-radius:12px;margin-bottom:24px"><tr><td style="padding:24px"><p style="color:#991b1b;margin:0"><strong>Reason:</strong> {{suspensionReason}}</p></td></tr></table><p style="color:#484848;font-size:14px;line-height:22px;margin:0 0 24px 0;text-align:center">If you believe this is an error, please contact our support team.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center"><a href="mailto:support@planbeau.com" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">Contact Support</a></td></tr></table></td></tr></table></td></tr></table>', N'Account Suspended: {{suspensionReason}}. Contact support if you believe this is an error.', N'Account suspension notification', 1, GETDATE(), GETDATE());
        PRINT 'Added Account Suspended component';
    END

    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'Account Reactivated')
    BEGIN
        INSERT [admin].[EmailTemplateComponents] ([ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt])
        VALUES (N'body', N'Account Reactivated', N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff"><tr><td align="center" style="padding:0 24px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px"><tr><td style="padding:32px 0"><div style="width:48px;height:48px;background:#d1fae5;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px auto"><span style="font-size:24px">✓</span></div><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 16px 0;text-align:center">Account Reactivated</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{recipientName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 24px 0">Good news! Your account has been reactivated and you now have full access to {{platformName}} again.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f0fdf4;border-radius:12px;margin-bottom:24px"><tr><td style="padding:24px;text-align:center"><p style="color:#166534;margin:0">Your account is now active and all features have been restored.</p></td></tr></table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center"><a href="{{frontendUrl}}/dashboard" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">Go to Dashboard</a></td></tr></table></td></tr></table></td></tr></table>', N'Account Reactivated: Your account is now active and all features have been restored.', N'Account reactivation notification', 1, GETDATE(), GETDATE());
        PRINT 'Added Account Reactivated component';
    END

    -- Password Reset component (clean style matching Account Reactivated)
    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'Password Reset')
    BEGIN
        INSERT [admin].[EmailTemplateComponents] ([ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt])
        VALUES (N'body', N'Password Reset', N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff"><tr><td align="center" style="padding:0 24px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px"><tr><td style="padding:32px 0"><div style="width:48px;height:48px;background:#dbeafe;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px auto"><span style="font-size:24px;color:#2563eb">&#128274;</span></div><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 16px 0;text-align:center">Reset Your Password</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{userName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 24px 0">We received a request to reset your password for your PlanBeau account. Click the button below to create a new password.</p><p style="color:#717171;font-size:14px;line-height:22px;margin:0 0 24px 0">This link will expire in <strong>{{expiryTime}}</strong>.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center"><a href="{{resetUrl}}" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">Reset Password</a></td></tr></table><p style="color:#717171;font-size:14px;line-height:22px;margin:24px 0 0 0;text-align:center">If you did not request this, you can safely ignore this email.</p></td></tr></table></td></tr></table>', N'Hi {{userName}}, We received a request to reset your password. Visit this link to create a new password: {{resetUrl}} This link will expire in {{expiryTime}}.', N'Password reset request email body', 1, GETDATE(), GETDATE());
        PRINT 'Added Password Reset component';
    END

    -- Password Changed component (clean style)
    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'Password Changed')
    BEGIN
        INSERT [admin].[EmailTemplateComponents] ([ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt])
        VALUES (N'body', N'Password Changed', N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff"><tr><td align="center" style="padding:0 24px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px"><tr><td style="padding:32px 0"><div style="width:48px;height:48px;background:#d1fae5;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px auto"><span style="font-size:24px;color:#059669">&#10003;</span></div><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 16px 0;text-align:center">Password Changed Successfully</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{userName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 24px 0">Your password has been successfully changed. You can now log in with your new password.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fef3c7;border-radius:12px;margin-bottom:24px"><tr><td style="padding:16px;text-align:center"><p style="color:#92400e;font-size:14px;margin:0"><strong>Did not make this change?</strong> Contact our support team immediately.</p></td></tr></table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center"><a href="https://www.planbeau.com" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">Go to PlanBeau</a></td></tr></table></td></tr></table></td></tr></table>', N'Hi {{userName}}, Your password has been successfully changed. You can now log in with your new password. If you did not make this change, please contact support immediately.', N'Password changed confirmation email body', 1, GETDATE(), GETDATE());
        PRINT 'Added Password Changed component';
    END

    -- Support Ticket Opened component (clean style)
    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'Support Ticket Opened')
    BEGIN
        INSERT [admin].[EmailTemplateComponents] ([ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt])
        VALUES (N'body', N'Support Ticket Opened', N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff"><tr><td align="center" style="padding:0 24px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px"><tr><td style="padding:32px 0"><div style="width:48px;height:48px;background:#dbeafe;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px auto"><span style="font-size:24px;color:#2563eb">&#9993;</span></div><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 16px 0;text-align:center">Support Ticket Created</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{userName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 24px 0">We have received your support request and created ticket <strong>#{{ticketId}}</strong>. Our team will review it and get back to you as soon as possible.</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 8px 0"><strong>Subject:</strong> {{ticketSubject}}</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 24px 0"><strong>Status:</strong> <span style="color:#f59e0b;font-weight:600">Open</span></p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center"><a href="{{dashboardUrl}}" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">View Ticket</a></td></tr></table></td></tr></table></td></tr></table>', N'Hi {{userName}}, We have received your support request and created ticket #{{ticketId}}. Subject: {{ticketSubject}}. Status: Open. View your ticket at: {{dashboardUrl}}', N'Support ticket opened notification', 1, GETDATE(), GETDATE());
        PRINT 'Added Support Ticket Opened component';
    END

    -- Support Ticket In Progress component (clean style)
    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'Support Ticket In Progress')
    BEGIN
        INSERT [admin].[EmailTemplateComponents] ([ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt])
        VALUES (N'body', N'Support Ticket In Progress', N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff"><tr><td align="center" style="padding:0 24px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px"><tr><td style="padding:32px 0"><div style="width:48px;height:48px;background:#dbeafe;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px auto"><span style="font-size:24px;color:#2563eb">&#9881;</span></div><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 16px 0;text-align:center">Your Ticket Is Being Worked On</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{userName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 24px 0">Good news! Our support team has started working on your ticket <strong>#{{ticketId}}</strong>.</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 8px 0"><strong>Subject:</strong> {{ticketSubject}}</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 24px 0"><strong>Status:</strong> <span style="color:#3b82f6;font-weight:600">In Progress</span></p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center"><a href="{{dashboardUrl}}" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">View Ticket</a></td></tr></table></td></tr></table></td></tr></table>', N'Hi {{userName}}, Good news! Our support team has started working on your ticket #{{ticketId}}. Subject: {{ticketSubject}}. Status: In Progress. View your ticket at: {{dashboardUrl}}', N'Support ticket in progress notification', 1, GETDATE(), GETDATE());
        PRINT 'Added Support Ticket In Progress component';
    END

    -- Support Ticket Closed component (clean style)
    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'Support Ticket Closed')
    BEGIN
        INSERT [admin].[EmailTemplateComponents] ([ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt])
        VALUES (N'body', N'Support Ticket Closed', N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff"><tr><td align="center" style="padding:0 24px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px"><tr><td style="padding:32px 0"><div style="width:48px;height:48px;background:#d1fae5;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px auto"><span style="font-size:24px;color:#059669">&#10003;</span></div><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 16px 0;text-align:center">Your Ticket Has Been Resolved</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{userName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 24px 0">Your support ticket <strong>#{{ticketId}}</strong> has been resolved and closed.</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 8px 0"><strong>Subject:</strong> {{ticketSubject}}</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 24px 0"><strong>Status:</strong> <span style="color:#059669;font-weight:600">Resolved</span></p><p style="color:#717171;font-size:14px;line-height:22px;margin:0 0 24px 0">If you have any further questions, feel free to open a new ticket.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center"><a href="{{dashboardUrl}}" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">View Ticket History</a></td></tr></table></td></tr></table></td></tr></table>', N'Hi {{userName}}, Your support ticket #{{ticketId}} has been resolved and closed. Subject: {{ticketSubject}}. View your ticket history at: {{dashboardUrl}}', N'Support ticket closed notification', 1, GETDATE(), GETDATE());
        PRINT 'Added Support Ticket Closed component';
    END

    -- Support Ticket Reply component (clean style)
    IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'Support Ticket Reply')
    BEGIN
        INSERT [admin].[EmailTemplateComponents] ([ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt])
        VALUES (N'body', N'Support Ticket Reply', N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff"><tr><td align="center" style="padding:0 24px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px"><tr><td style="padding:32px 0"><div style="width:48px;height:48px;background:#dbeafe;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px auto"><span style="font-size:24px;color:#2563eb">&#128172;</span></div><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 16px 0;text-align:center">New Reply on Your Ticket</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{userName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 24px 0">There is a new reply on your support ticket <strong>#{{ticketId}}</strong>.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;border-radius:12px;border-left:4px solid #2563eb;margin-bottom:24px"><tr><td style="padding:16px 20px"><p style="color:#717171;font-size:12px;margin:0 0 8px 0"><strong>{{replierName}}</strong> replied:</p><p style="color:#222222;font-size:14px;line-height:22px;margin:0">{{replyPreview}}</p></td></tr></table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center"><a href="{{dashboardUrl}}" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">View Full Conversation</a></td></tr></table></td></tr></table></td></tr></table>', N'Hi {{userName}}, There is a new reply on your support ticket #{{ticketId}}. {{replierName}} replied: {{replyPreview}}. View the full conversation at: {{dashboardUrl}}', N'Support ticket reply notification', 1, GETDATE(), GETDATE());
        PRINT 'Added Support Ticket Reply component';
    END

    -- Remove duplicate Password Reset component (ComponentID 41) - keep only ComponentID 35
    -- First update any EmailTemplates using ComponentID 41 to use 35 instead
    IF EXISTS (SELECT 1 FROM [admin].[EmailTemplateComponents] WHERE ComponentID = 41 AND [ComponentName] = 'Password Reset')
    BEGIN
        -- Update EmailTemplates to use ComponentID 35 instead of 41
        UPDATE [admin].[EmailTemplates]
        SET BodyComponentID = 35, UpdatedAt = GETDATE()
        WHERE BodyComponentID = 41;
        
        -- Delete the duplicate ComponentID 41
        DELETE FROM [admin].[EmailTemplateComponents] 
        WHERE ComponentID = 41;
        
        PRINT 'Deleted Password Reset ComponentID 41, updated templates to use ComponentID 35';
    END
    ELSE
    BEGIN
        -- Fallback: Remove any duplicate Password Reset components by name (keep lowest ID)
        DECLARE @FirstPasswordResetID INT;
        SELECT TOP 1 @FirstPasswordResetID = ComponentID 
        FROM [admin].[EmailTemplateComponents] 
        WHERE [ComponentName] = 'Password Reset' 
        ORDER BY ComponentID ASC;
        
        IF @FirstPasswordResetID IS NOT NULL
        BEGIN
            -- Update EmailTemplates to use the first Password Reset component
            UPDATE [admin].[EmailTemplates]
            SET BodyComponentID = @FirstPasswordResetID, UpdatedAt = GETDATE()
            WHERE BodyComponentID IN (
                SELECT ComponentID FROM [admin].[EmailTemplateComponents] 
                WHERE [ComponentName] = 'Password Reset' AND ComponentID > @FirstPasswordResetID
            );
            
            -- Delete any duplicate Password Reset components
            DELETE FROM [admin].[EmailTemplateComponents] 
            WHERE [ComponentName] = 'Password Reset' AND ComponentID > @FirstPasswordResetID;
            
            IF @@ROWCOUNT > 0
                PRINT 'Removed duplicate Password Reset components, keeping ComponentID: ' + CAST(@FirstPasswordResetID AS VARCHAR(10));
        END
    END

    -- Update TextContent for Event Reminder with proper descriptive content
    UPDATE [admin].[EmailTemplateComponents]
    SET [TextContent] = N'Hello {{recipientName}},

This is a friendly reminder that your upcoming event is in {{daysUntilEvent}}.

Event Details:
- Service: {{serviceName}}
- Date: {{eventDate}}
- Time: {{eventTime}}
- Location: {{location}}
- {{otherPartyLabel}}: {{otherPartyName}}

Please make sure you are prepared for your event. If you have any questions, feel free to reach out to {{otherPartyName}} through the messaging feature.

View your booking details at: {{frontendUrl}}/dashboard?tab=bookings

Best regards,
The {{platformName}} Team',
        [UpdatedAt] = GETDATE()
    WHERE [ComponentName] = 'Event Reminder';

    -- Update TextContent for Booking Action Reminder with proper descriptive content
    UPDATE [admin].[EmailTemplateComponents]
    SET [TextContent] = N'Hello {{recipientName}},

{{actionMessage}}

Booking Details:
- Service: {{serviceName}}
- Date: {{eventDate}}
- {{otherPartyLabel}}: {{otherPartyName}}

Please take action soon to avoid any delays or issues with your booking.

{{actionButtonText}}: {{actionUrl}}

Best regards,
The {{platformName}} Team',
        [UpdatedAt] = GETDATE()
    WHERE [ComponentName] = 'Booking Action Reminder';

    -- Update TextContent for Analytics Summary with proper descriptive content
    UPDATE [admin].[EmailTemplateComponents]
    SET [TextContent] = N'Hello {{recipientName}},

Here is your {{summaryPeriod}} analytics summary for {{periodRange}}.

Performance Overview:
- Profile Views: {{profileViews}} ({{viewsChange}} from last period)
- Bookings: {{bookings}} ({{bookingsChange}} from last period)
- Revenue: {{revenue}} ({{revenueChange}} from last period)
- Conversion Rate: {{conversionRate}}

Keep up the great work! View your full analytics dashboard at: {{frontendUrl}}/dashboard?tab=analytics

Best regards,
The {{platformName}} Team',
        [UpdatedAt] = GETDATE()
    WHERE [ComponentName] = 'Analytics Summary';

    -- Update TextContent for Account Suspended with proper descriptive content
    UPDATE [admin].[EmailTemplateComponents]
    SET [TextContent] = N'Hello {{recipientName}},

Your {{platformName}} account has been temporarily suspended.

Reason for suspension: {{suspensionReason}}

If you believe this is an error or would like to appeal this decision, please contact our support team at support@planbeau.com.

We take the safety and integrity of our platform seriously and appreciate your understanding.

Best regards,
The {{platformName}} Team',
        [UpdatedAt] = GETDATE()
    WHERE [ComponentName] = 'Account Suspended';

    -- Update TextContent for Account Reactivated with proper descriptive content
    UPDATE [admin].[EmailTemplateComponents]
    SET [TextContent] = N'Hello {{recipientName}},

Great news! Your {{platformName}} account has been reactivated.

Your account is now active and all features have been restored. You can log in and continue using the platform as normal.

Go to your dashboard: {{frontendUrl}}/dashboard

If you have any questions, please do not hesitate to contact our support team.

Best regards,
The {{platformName}} Team',
        [UpdatedAt] = GETDATE()
    WHERE [ComponentName] = 'Account Reactivated';

    PRINT 'Updated TextContent for support email templates';
END
GO

-- =============================================
-- UNCONDITIONAL CLEANUP - Always runs to ensure data integrity
-- =============================================
PRINT 'Running unconditional cleanup...';

-- Delete duplicate Password Reset ComponentID 41 (keep only 35)
IF EXISTS (SELECT 1 FROM [admin].[EmailTemplateComponents] WHERE ComponentID = 41)
BEGIN
    -- First update any templates using ComponentID 41 to use a valid component
    UPDATE [admin].[EmailTemplates]
    SET BodyComponentID = (SELECT TOP 1 ComponentID FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'Password Reset' AND ComponentID <> 41 ORDER BY ComponentID ASC),
        UpdatedAt = GETDATE()
    WHERE BodyComponentID = 41;
    
    -- Delete ComponentID 41
    DELETE FROM [admin].[EmailTemplateComponents] WHERE ComponentID = 41;
    PRINT 'Deleted ComponentID 41 (duplicate Password Reset)';
END

-- Ensure password_reset template uses the correct Password Reset component (not 41)
DECLARE @CorrectPasswordResetID INT;
SELECT TOP 1 @CorrectPasswordResetID = ComponentID 
FROM [admin].[EmailTemplateComponents] 
WHERE [ComponentName] = 'Password Reset' 
ORDER BY ComponentID ASC;

IF @CorrectPasswordResetID IS NOT NULL
BEGIN
    UPDATE [admin].[EmailTemplates]
    SET BodyComponentID = @CorrectPasswordResetID, UpdatedAt = GETDATE()
    WHERE TemplateKey = 'password_reset' AND BodyComponentID <> @CorrectPasswordResetID;
    PRINT 'Ensured password_reset template uses ComponentID: ' + CAST(@CorrectPasswordResetID AS VARCHAR(10));
END

-- Update TextContent for support emails (unconditional)
UPDATE [admin].[EmailTemplateComponents]
SET [TextContent] = N'Hello {{recipientName}},

This is a friendly reminder that your upcoming event is in {{daysUntilEvent}}.

Event Details:
- Service: {{serviceName}}
- Date: {{eventDate}}
- Time: {{eventTime}}
- Location: {{location}}
- {{otherPartyLabel}}: {{otherPartyName}}

Please make sure you are prepared for your event. If you have any questions, feel free to reach out to {{otherPartyName}} through the messaging feature.

View your booking details at: {{frontendUrl}}/dashboard?tab=bookings

Best regards,
The {{platformName}} Team',
    [UpdatedAt] = GETDATE()
WHERE [ComponentName] = 'Event Reminder';

UPDATE [admin].[EmailTemplateComponents]
SET [TextContent] = N'Hello {{recipientName}},

{{actionMessage}}

Booking Details:
- Service: {{serviceName}}
- Date: {{eventDate}}
- {{otherPartyLabel}}: {{otherPartyName}}

Please take action soon to avoid any delays or issues with your booking.

{{actionButtonText}}: {{actionUrl}}

Best regards,
The {{platformName}} Team',
    [UpdatedAt] = GETDATE()
WHERE [ComponentName] = 'Booking Action Reminder';

UPDATE [admin].[EmailTemplateComponents]
SET [TextContent] = N'Hello {{recipientName}},

Here is your {{summaryPeriod}} analytics summary for {{periodRange}}.

Performance Overview:
- Profile Views: {{profileViews}} ({{viewsChange}} from last period)
- Bookings: {{bookings}} ({{bookingsChange}} from last period)
- Revenue: {{revenue}} ({{revenueChange}} from last period)
- Conversion Rate: {{conversionRate}}

Keep up the great work! View your full analytics dashboard at: {{frontendUrl}}/dashboard?tab=analytics

Best regards,
The {{platformName}} Team',
    [UpdatedAt] = GETDATE()
WHERE [ComponentName] = 'Analytics Summary';

UPDATE [admin].[EmailTemplateComponents]
SET [TextContent] = N'Hello {{recipientName}},

Your {{platformName}} account has been temporarily suspended.

Reason for suspension: {{suspensionReason}}

If you believe this is an error or would like to appeal this decision, please contact our support team at support@planbeau.com.

We take the safety and integrity of our platform seriously and appreciate your understanding.

Best regards,
The {{platformName}} Team',
    [UpdatedAt] = GETDATE()
WHERE [ComponentName] = 'Account Suspended';

UPDATE [admin].[EmailTemplateComponents]
SET [TextContent] = N'Hello {{recipientName}},

Great news! Your {{platformName}} account has been reactivated.

Your account is now active and all features have been restored. You can log in and continue using the platform as normal.

Go to your dashboard: {{frontendUrl}}/dashboard

If you have any questions, please do not hesitate to contact our support team.

Best regards,
The {{platformName}} Team',
    [UpdatedAt] = GETDATE()
WHERE [ComponentName] = 'Account Reactivated';

PRINT 'Unconditional cleanup completed - ComponentID 41 deleted, TextContent updated for support emails';

-- Add Review Request email component if not exists
IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'Review Request')
BEGIN
    INSERT INTO [admin].[EmailTemplateComponents] ([ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt])
    VALUES (
        N'body',
        N'Review Request',
        N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7"><tr><td align="center" style="padding:0 20px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border:1px solid #ebebeb;border-top:none"><tr><td style="padding:40px"><h2 style="color:#667eea;margin:0 0 20px;text-align:center">How Was Your Event?</h2><p style="color:#666;margin:0 0 20px">Hello {{clientName}},</p><p style="color:#666;margin:0 0 30px">We hope your event with <strong>{{vendorName}}</strong> went wonderfully! Your feedback helps other clients find great vendors and helps vendors improve their services.</p><div style="background:#f0f4ff;padding:20px;border-radius:8px;border-left:4px solid #667eea;margin:0 0 30px"><h3 style="color:#4338ca;margin:0 0 15px;font-size:16px">Event Details</h3><p style="color:#4338ca;margin:5px 0"><strong>Vendor:</strong> {{vendorName}}</p><p style="color:#4338ca;margin:5px 0"><strong>Service:</strong> {{serviceName}}</p><p style="color:#4338ca;margin:5px 0"><strong>Date:</strong> {{eventDate}}</p></div><p style="color:#666;margin:0 0 30px">Would you take a moment to share your experience? It only takes a few minutes.</p><p style="text-align:center;margin:0"><a href="{{reviewUrl}}" style="display:inline-block;background:#222222;color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:600">Write a Review</a></p><p style="color:#999;font-size:12px;margin:30px 0 0;text-align:center">This review link is valid for 30 days after your event.</p></td></tr></table></td></tr></table>',
        N'Hello {{clientName}},

We hope your event with {{vendorName}} went wonderfully! Your feedback helps other clients find great vendors.

Event Details:
- Vendor: {{vendorName}}
- Service: {{serviceName}}
- Date: {{eventDate}}

Would you take a moment to share your experience? Click here to write a review: {{reviewUrl}}

This review link is valid for 30 days after your event.

Thank you,
The {{platformName}} Team',
        N'Post-event review request email sent the morning after the event',
        1,
        GETDATE(),
        GETDATE()
    );
    PRINT 'Added Review Request email component';
END

-- Support Message Received (to user when support team replies)
IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'Support Message Received')
BEGIN
    INSERT [admin].[EmailTemplateComponents] ([ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt])
    VALUES (
        N'body', 
        N'Support Message Received', 
        N'<div style="padding:40px 20px;background:white"><h2 style="color:#667eea;margin:0 0 20px">New Message from Planbeau Support</h2><p style="color:#666;margin:0 0 20px">Hello {{userName}},</p><p style="color:#666;margin:0 0 30px">You have received a new message from our support team:</p><div style="background:#f0f4ff;padding:20px;border-radius:8px;border-left:4px solid #667eea;margin:0 0 30px"><p style="color:#333;margin:0;font-style:italic">"{{messagePreview}}"</p></div><p style="text-align:center;margin:0"><a href="{{dashboardUrl}}" style="display:inline-block;background:#222222;color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:600">View Full Message</a></p></div>', 
        N'Hello {{userName}}, You have a new message from Planbeau Support: "{{messagePreview}}". View at: {{dashboardUrl}}', 
        N'Email sent to user when support team replies to their conversation', 
        1, 
        GETDATE(), 
        GETDATE()
    );
    PRINT 'Added Support Message Received component';
END

-- New Support Message (to support team when user sends message)
IF NOT EXISTS (SELECT 1 FROM [admin].[EmailTemplateComponents] WHERE [ComponentName] = 'New Support Message')
BEGIN
    INSERT [admin].[EmailTemplateComponents] ([ComponentType], [ComponentName], [HtmlContent], [TextContent], [Description], [IsActive], [CreatedAt], [UpdatedAt])
    VALUES (
        N'body', 
        N'New Support Message', 
        N'<div style="padding:40px 20px;background:white"><h2 style="color:#dc3545;margin:0 0 20px">New Support Message</h2><p style="color:#666;margin:0 0 30px">A user has sent a new message requiring attention.</p><div style="background:#fff3cd;padding:20px;border-radius:8px;border-left:4px solid #ffc107;margin:0 0 30px"><h3 style="color:#856404;margin:0 0 15px;font-size:16px">User Details</h3><p style="color:#856404;margin:5px 0"><strong>Name:</strong> {{userName}}</p><p style="color:#856404;margin:5px 0"><strong>Email:</strong> {{userEmail}}</p><p style="color:#856404;margin:5px 0"><strong>Conversation ID:</strong> {{conversationId}}</p></div><div style="background:#f8f9fa;padding:20px;border-radius:8px;border-left:4px solid #6c757d;margin:0 0 30px"><h3 style="color:#495057;margin:0 0 15px;font-size:16px">Message Preview</h3><p style="color:#333;margin:0;font-style:italic">"{{messagePreview}}"</p></div><p style="text-align:center;margin:0"><a href="{{adminUrl}}" style="display:inline-block;background:#dc3545;color:white;padding:14px 30px;text-decoration:none;border-radius:6px;font-weight:600">Respond Now</a></p></div>', 
        N'New support message from {{userName}} ({{userEmail}}). Conversation ID: {{conversationId}}. Message: "{{messagePreview}}". Respond at: {{adminUrl}}', 
        N'Email sent to support team when user sends a message', 
        1, 
        GETDATE(), 
        GETDATE()
    );
    PRINT 'Added New Support Message component';
END
GO
