/*
    Migration Script: Update Email Template Components - Minimal White Design
    Phase: 900 - Data
    Script: cu_900_03_EmailTemplateComponents_Update.sql
    Description: Updates header and footer to minimal white design (Airbnb-style)
    
    Execution Order: After cu_900_03_EmailTemplateComponents.sql
*/

SET NOCOUNT ON;
GO

PRINT 'Updating email template components to minimal white design...';
GO

-- Update Default Header (ComponentID 1) - Minimal white with centered logo
UPDATE [admin].[EmailTemplateComponents]
SET [HtmlContent] = N'<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,''Helvetica Neue'',Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff"><tr><td align="center" style="padding:40px 20px 30px 20px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"><tr><td align="center"><img src="{{logoUrl}}" alt="{{platformName}}" style="height:40px;width:auto" height="40"></td></tr></table></td></tr></table>',
    [TextContent] = N'{{platformName}}',
    [Description] = N'Minimal white header with centered logo',
    [UpdatedAt] = GETDATE()
WHERE [ComponentID] = 1;

-- Update Default Header (ComponentID 10) - Minimal white with centered logo
UPDATE [admin].[EmailTemplateComponents]
SET [HtmlContent] = N'<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,''Helvetica Neue'',Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff"><tr><td align="center" style="padding:40px 20px 30px 20px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"><tr><td align="center"><img src="{{logoUrl}}" alt="{{platformName}}" style="height:40px;width:auto" height="40"></td></tr></table></td></tr></table>',
    [TextContent] = N'{{platformName}}',
    [Description] = N'Minimal white header with centered logo',
    [UpdatedAt] = GETDATE()
WHERE [ComponentID] = 10;

-- Update Default Footer (ComponentID 2) - Clean minimal footer with text social links
UPDATE [admin].[EmailTemplateComponents]
SET [HtmlContent] = N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="border-top:1px solid #ebebeb;padding-top:40px"><img src="{{logoUrl}}" alt="{{platformName}}" style="height:32px;width:auto;margin-bottom:16px" height="32"><p style="color:#717171;font-size:14px;line-height:20px;margin:0 0 20px 0">The easiest way to find amazing vendors for your events.</p><table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 24px auto"><tr><td style="padding:0 12px"><a href="https://instagram.com/planbeau" style="color:#222222;text-decoration:none;font-size:13px;font-weight:500">Instagram</a></td><td style="padding:0 12px;border-left:1px solid #ebebeb"><a href="https://facebook.com/planbeau" style="color:#222222;text-decoration:none;font-size:13px;font-weight:500">Facebook</a></td><td style="padding:0 12px;border-left:1px solid #ebebeb"><a href="https://twitter.com/planbeau" style="color:#222222;text-decoration:none;font-size:13px;font-weight:500">X</a></td></tr></table><p style="color:#717171;font-size:12px;line-height:18px;margin:0 0 8px 0">{{platformName}} Inc., Toronto, ON, Canada</p><p style="color:#717171;font-size:12px;line-height:18px;margin:0 0 8px 0"><a href="mailto:support@{{platformUrl}}" style="color:#717171;text-decoration:underline">support@{{platformUrl}}</a></p><p style="color:#b0b0b0;font-size:11px;line-height:16px;margin:16px 0 0 0">© {{currentYear}} {{platformName}}. All rights reserved.</p></td></tr></table></td></tr></table></body></html>',
    [TextContent] = N'---
{{platformName}} Inc., Toronto, ON, Canada
Contact: support@{{platformUrl}}
© {{currentYear}} {{platformName}}. All rights reserved.',
    [Description] = N'Minimal white footer with social links',
    [UpdatedAt] = GETDATE()
WHERE [ComponentID] = 2;

-- Update Default Footer (ComponentID 11) - Clean minimal footer with text social links
UPDATE [admin].[EmailTemplateComponents]
SET [HtmlContent] = N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="border-top:1px solid #ebebeb;padding-top:40px"><img src="{{logoUrl}}" alt="{{platformName}}" style="height:32px;width:auto;margin-bottom:16px" height="32"><p style="color:#717171;font-size:14px;line-height:20px;margin:0 0 20px 0">The easiest way to find amazing vendors for your events.</p><table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 24px auto"><tr><td style="padding:0 12px"><a href="https://instagram.com/planbeau" style="color:#222222;text-decoration:none;font-size:13px;font-weight:500">Instagram</a></td><td style="padding:0 12px;border-left:1px solid #ebebeb"><a href="https://facebook.com/planbeau" style="color:#222222;text-decoration:none;font-size:13px;font-weight:500">Facebook</a></td><td style="padding:0 12px;border-left:1px solid #ebebeb"><a href="https://twitter.com/planbeau" style="color:#222222;text-decoration:none;font-size:13px;font-weight:500">X</a></td></tr></table><p style="color:#717171;font-size:12px;line-height:18px;margin:0 0 8px 0">{{platformName}} Inc., Toronto, ON, Canada</p><p style="color:#717171;font-size:12px;line-height:18px;margin:0 0 8px 0"><a href="mailto:support@{{platformUrl}}" style="color:#717171;text-decoration:underline">support@{{platformUrl}}</a></p><p style="color:#b0b0b0;font-size:11px;line-height:16px;margin:16px 0 0 0">© {{currentYear}} {{platformName}}. All rights reserved.</p></td></tr></table></td></tr></table></body></html>',
    [TextContent] = N'---
{{platformName}} Inc., Toronto, ON, Canada
Contact: support@{{platformUrl}}
© {{currentYear}} {{platformName}}. All rights reserved.',
    [Description] = N'Minimal white footer with social links',
    [UpdatedAt] = GETDATE()
WHERE [ComponentID] = 11;

-- Update body templates to use clean black buttons instead of purple gradient

-- 2FA Code (ComponentID 3)
UPDATE [admin].[EmailTemplateComponents]
SET [HtmlContent] = N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff"><tr><td align="center" style="padding:0 20px 40px 20px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"><tr><td style="padding:0"><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 24px 0;text-align:center">Verification Code</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{userName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 32px 0">Your verification code is:</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:24px 0;background-color:#f7f7f7;border-radius:12px"><span style="color:#222222;font-size:36px;font-weight:700;letter-spacing:8px">{{code}}</span></td></tr></table><p style="color:#717171;font-size:14px;line-height:20px;margin:24px 0 0 0;text-align:center">This code expires in <strong>10 minutes</strong>.</p></td></tr></table></td></tr></table>',
    [UpdatedAt] = GETDATE()
WHERE [ComponentID] = 3;

UPDATE [admin].[EmailTemplateComponents]
SET [HtmlContent] = N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff"><tr><td align="center" style="padding:0 20px 40px 20px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"><tr><td style="padding:0"><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 24px 0;text-align:center">Verification Code</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{userName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 32px 0">Your verification code is:</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:24px 0;background-color:#f7f7f7;border-radius:12px"><span style="color:#222222;font-size:36px;font-weight:700;letter-spacing:8px">{{code}}</span></td></tr></table><p style="color:#717171;font-size:14px;line-height:20px;margin:24px 0 0 0;text-align:center">This code expires in <strong>10 minutes</strong>.</p></td></tr></table></td></tr></table>',
    [UpdatedAt] = GETDATE()
WHERE [ComponentID] = 12;

-- Booking Request (ComponentID 4, 13)
UPDATE [admin].[EmailTemplateComponents]
SET [HtmlContent] = N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff"><tr><td align="center" style="padding:0 20px 40px 20px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"><tr><td style="padding:0"><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 24px 0;text-align:center">New Booking Request</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{vendorName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 32px 0">You have a new booking request from <strong>{{clientName}}</strong>.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7;border-radius:12px"><tr><td style="padding:24px"><p style="color:#222222;font-size:14px;font-weight:600;margin:0 0 16px 0">Event Details</p><p style="color:#484848;font-size:14px;line-height:22px;margin:0 0 8px 0"><strong>Service:</strong> {{serviceName}}</p><p style="color:#484848;font-size:14px;line-height:22px;margin:0 0 8px 0"><strong>Date:</strong> {{eventDate}}</p><p style="color:#484848;font-size:14px;line-height:22px;margin:0 0 8px 0"><strong>Location:</strong> {{location}}</p><p style="color:#484848;font-size:14px;line-height:22px;margin:0"><strong>Budget:</strong> {{budget}}</p></td></tr></table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:32px 0 0 0"><a href="{{dashboardUrl}}" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">View Request</a></td></tr></table></td></tr></table></td></tr></table>',
    [UpdatedAt] = GETDATE()
WHERE [ComponentID] IN (4, 13);

-- Booking Accepted (ComponentID 5, 14)
UPDATE [admin].[EmailTemplateComponents]
SET [HtmlContent] = N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff"><tr><td align="center" style="padding:0 20px 40px 20px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"><tr><td style="padding:0"><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 24px 0;text-align:center">Booking Confirmed!</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{clientName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 32px 0">Great news! <strong>{{vendorName}}</strong> has accepted your booking request for <strong>{{serviceName}}</strong>.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7;border-radius:12px"><tr><td style="padding:24px"><p style="color:#222222;font-size:14px;font-weight:600;margin:0 0 16px 0">Next Steps</p><p style="color:#484848;font-size:14px;line-height:22px;margin:0 0 8px 0">1. Review your booking details</p><p style="color:#484848;font-size:14px;line-height:22px;margin:0 0 8px 0">2. Complete payment to confirm</p><p style="color:#484848;font-size:14px;line-height:22px;margin:0">3. Message your vendor with any questions</p></td></tr></table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:32px 0 0 0"><a href="{{dashboardUrl}}" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">View Booking</a></td></tr></table></td></tr></table></td></tr></table>',
    [UpdatedAt] = GETDATE()
WHERE [ComponentID] IN (5, 14);

-- Booking Rejected (ComponentID 6, 15)
UPDATE [admin].[EmailTemplateComponents]
SET [HtmlContent] = N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff"><tr><td align="center" style="padding:0 20px 40px 20px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"><tr><td style="padding:0"><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 24px 0;text-align:center">Booking Update</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{clientName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Unfortunately, <strong>{{vendorName}}</strong> is unable to accept your request for <strong>{{serviceName}}</strong> on {{eventDate}}.</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 32px 0">Don''t worry - there are many other amazing vendors ready to help make your event special!</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:0"><a href="{{searchUrl}}" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">Find Other Vendors</a></td></tr></table></td></tr></table></td></tr></table>',
    [UpdatedAt] = GETDATE()
WHERE [ComponentID] IN (6, 15);

-- Message From Vendor (ComponentID 7, 16)
UPDATE [admin].[EmailTemplateComponents]
SET [HtmlContent] = N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff"><tr><td align="center" style="padding:0 20px 40px 20px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"><tr><td style="padding:0"><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 24px 0;text-align:center">New Message from {{vendorName}}</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 32px 0">Hello {{clientName}},</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7;border-radius:12px;border-left:4px solid #222222"><tr><td style="padding:24px"><p style="color:#484848;font-size:16px;line-height:24px;margin:0">{{messageContent}}</p></td></tr></table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:32px 0 0 0"><a href="{{dashboardUrl}}" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">Reply</a></td></tr></table></td></tr></table></td></tr></table>',
    [UpdatedAt] = GETDATE()
WHERE [ComponentID] IN (7, 16);

-- Message From Client (ComponentID 8, 17)
UPDATE [admin].[EmailTemplateComponents]
SET [HtmlContent] = N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff"><tr><td align="center" style="padding:0 20px 40px 20px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"><tr><td style="padding:0"><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 24px 0;text-align:center">New Message from {{clientName}}</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 32px 0">Hello {{vendorName}},</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7;border-radius:12px;border-left:4px solid #222222"><tr><td style="padding:24px"><p style="color:#484848;font-size:16px;line-height:24px;margin:0">{{messageContent}}</p></td></tr></table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:32px 0 0 0"><a href="{{dashboardUrl}}" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">Reply</a></td></tr></table></td></tr></table></td></tr></table>',
    [UpdatedAt] = GETDATE()
WHERE [ComponentID] IN (8, 17);

-- Payment Received (ComponentID 9, 18)
UPDATE [admin].[EmailTemplateComponents]
SET [HtmlContent] = N'<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff"><tr><td align="center" style="padding:0 20px 40px 20px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"><tr><td style="padding:0"><h1 style="color:#222222;font-size:24px;font-weight:600;margin:0 0 24px 0;text-align:center">Payment Received</h1><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 16px 0">Hello {{vendorName}},</p><p style="color:#484848;font-size:16px;line-height:24px;margin:0 0 32px 0">You''ve received a payment from <strong>{{clientName}}</strong>.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f7f7f7;border-radius:12px"><tr><td style="padding:24px"><p style="color:#222222;font-size:14px;font-weight:600;margin:0 0 16px 0">Payment Details</p><p style="color:#222222;font-size:24px;font-weight:700;margin:0 0 16px 0">{{amount}}</p><p style="color:#484848;font-size:14px;line-height:22px;margin:0 0 8px 0"><strong>Service:</strong> {{serviceName}}</p><p style="color:#484848;font-size:14px;line-height:22px;margin:0"><strong>Event Date:</strong> {{eventDate}}</p></td></tr></table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:32px 0 0 0"><a href="{{dashboardUrl}}" style="display:inline-block;background-color:#222222;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px">View Payment</a></td></tr></table></td></tr></table></td></tr></table>',
    [UpdatedAt] = GETDATE()
WHERE [ComponentID] IN (9, 18);

PRINT 'Email template components updated to minimal white design.';
GO
