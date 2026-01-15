/*
    Migration Script: Fix NULL Columns with Default Values
    Description: Sets default values for columns that should not be NULL
    
    Execution Order: 10
*/

SET NOCOUNT ON;
GO

PRINT 'Fixing NULL columns with default values...';
GO

-- =============================================
-- users.Users - Set empty strings for optional text fields
-- =============================================
UPDATE users.Users SET Phone = '' WHERE Phone IS NULL;
UPDATE users.Users SET Bio = '' WHERE Bio IS NULL;
UPDATE users.Users SET ProfileImageURL = '' WHERE ProfileImageURL IS NULL;
UPDATE users.Users SET StripeCustomerID = '' WHERE StripeCustomerID IS NULL;
GO

PRINT 'Fixed users.Users NULL columns';
GO

-- =============================================
-- bookings.Bookings - Set sensible defaults
-- =============================================
UPDATE bookings.Bookings SET EventTime = '09:00:00' WHERE EventTime IS NULL;
UPDATE bookings.Bookings SET EventEndTime = DATEADD(HOUR, 2, CAST(EventTime AS TIME)) WHERE EventEndTime IS NULL;
UPDATE bookings.Bookings SET EventLocation = '' WHERE EventLocation IS NULL;
UPDATE bookings.Bookings SET EventName = 'Booking' WHERE EventName IS NULL;
UPDATE bookings.Bookings SET Services = '[]' WHERE Services IS NULL;
UPDATE bookings.Bookings SET GroupID = '' WHERE GroupID IS NULL;
GO

PRINT 'Fixed bookings.Bookings NULL columns';
GO

-- =============================================
-- vendors.VendorProfiles - Set empty strings and defaults
-- =============================================
UPDATE vendors.VendorProfiles SET BusinessPhone = '' WHERE BusinessPhone IS NULL;
UPDATE vendors.VendorProfiles SET BusinessEmail = '' WHERE BusinessEmail IS NULL;
UPDATE vendors.VendorProfiles SET Website = '' WHERE Website IS NULL;
UPDATE vendors.VendorProfiles SET LogoURL = '' WHERE LogoURL IS NULL;
UPDATE vendors.VendorProfiles SET StripeAccountID = '' WHERE StripeAccountID IS NULL;
UPDATE vendors.VendorProfiles SET AvgRating = 0 WHERE AvgRating IS NULL;
UPDATE vendors.VendorProfiles SET TotalBookings = 0 WHERE TotalBookings IS NULL;
UPDATE vendors.VendorProfiles SET TotalReviews = 0 WHERE TotalReviews IS NULL;
GO

PRINT 'Fixed vendors.VendorProfiles NULL columns';
GO

-- =============================================
-- invoices.Invoices - Fix PaymentStatus based on Status
-- =============================================
UPDATE invoices.Invoices
SET PaymentStatus = CASE 
    WHEN Status = 'paid' THEN 'paid'
    WHEN Status = 'cancelled' THEN 'cancelled'
    ELSE PaymentStatus
END,
PaidAt = CASE 
    WHEN Status = 'paid' AND PaidAt IS NULL THEN UpdatedAt
    ELSE PaidAt
END
WHERE Status IN ('paid', 'cancelled') AND (PaymentStatus = 'pending' OR PaymentStatus IS NULL);
GO

-- Set default 'pending' for any remaining NULL PaymentStatus
UPDATE invoices.Invoices SET PaymentStatus = 'pending' WHERE PaymentStatus IS NULL;
GO

PRINT 'Fixed invoices.Invoices PaymentStatus';
GO

-- =============================================
-- messages.Messages - Set ReadAt for read messages
-- =============================================
UPDATE messages.Messages SET ReadAt = GETDATE() WHERE IsRead = 1 AND ReadAt IS NULL;
GO

-- =============================================
-- notifications.Notifications - Set ReadAt for read notifications
-- =============================================
UPDATE notifications.Notifications SET ReadAt = GETDATE() WHERE IsRead = 1 AND ReadAt IS NULL;
GO

PRINT 'All NULL columns fixed successfully.';
GO
