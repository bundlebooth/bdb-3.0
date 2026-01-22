/*
    Migration Script: Create Unified Bookings View
    Phase: 400 - Views
    Script: cu_400_20_vw_UnifiedBookings.sql
    Description: Creates a unified view for the consolidated Bookings table
                 with status categories for filtering
    
    Status Definitions:
    - pending: Request awaiting vendor approval
    - approved: Vendor approved, awaiting client payment
    - paid: Payment received, event upcoming
    - completed: Event date has passed
    - cancelled: Cancelled by client, vendor, or admin
    - declined: Vendor declined the request
    - expired: Request expired without vendor response
    
    Execution Order: 20
*/

SET NOCOUNT ON;
GO

PRINT 'Creating view [bookings].[vw_UnifiedBookings]...';
GO

IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[bookings].[vw_UnifiedBookings]'))
    DROP VIEW [bookings].[vw_UnifiedBookings];
GO

CREATE VIEW [bookings].[vw_UnifiedBookings] AS
SELECT 
    b.BookingID,
    b.RequestID,
    b.UserID,
    b.VendorProfileID,
    b.ServiceID,
    b.BookingDate,
    b.EventDate,
    b.EndDate,
    b.EventTime,
    b.EventEndTime,
    -- Unified status logic
    CASE 
        WHEN b.Status IN ('cancelled', 'cancelled_by_client', 'cancelled_by_vendor', 'cancelled_by_admin') THEN 'cancelled'
        WHEN b.Status = 'declined' THEN 'declined'
        WHEN b.Status = 'expired' OR (b.Status = 'pending' AND b.ExpiresAt IS NOT NULL AND b.ExpiresAt < GETDATE()) THEN 'expired'
        WHEN b.EventDate < GETDATE() AND (b.FullAmountPaid = 1 OR b.Status = 'paid' OR b.Status = 'completed') THEN 'completed'
        WHEN b.FullAmountPaid = 1 OR b.Status = 'paid' THEN 'paid'
        WHEN b.Status IN ('confirmed', 'approved', 'accepted') THEN 'approved'
        WHEN b.Status = 'pending' THEN 'pending'
        ELSE b.Status
    END AS UnifiedStatus,
    b.Status AS OriginalStatus,
    b.TotalAmount,
    b.Budget,
    b.DepositAmount,
    b.DepositPaid,
    b.FullAmountPaid,
    b.AttendeeCount,
    b.SpecialRequests,
    b.Services,
    b.ResponseMessage,
    b.ProposedPrice,
    b.ExpiresAt,
    b.RespondedAt,
    b.ConfirmedAt,
    b.CancellationDate,
    b.CancelledAt,
    b.CancellationReason,
    b.CancelledBy,
    b.DeclinedReason,
    b.ExpiredAt,
    b.RefundAmount,
    b.StripePaymentIntentID,
    b.CreatedAt,
    b.UpdatedAt,
    b.EventLocation,
    b.EventName,
    b.EventType,
    b.TimeZone,
    b.GroupID,
    -- Client info
    CONCAT(u.FirstName, ' ', ISNULL(u.LastName, '')) AS ClientName,
    u.Email AS ClientEmail,
    u.Phone AS ClientPhone,
    u.ProfileImageURL AS ClientProfilePic,
    CAST(u.UserID AS NVARCHAR(50)) AS ClientPublicId,
    -- Vendor info
    vp.BusinessName AS VendorName,
    vp.BusinessEmail AS VendorEmail,
    vp.BusinessPhone AS VendorPhone,
    vp.LogoURL AS VendorLogo,
    CAST(vp.VendorProfileID AS NVARCHAR(50)) AS VendorPublicId,
    -- Service info
    COALESCE(s.Name, 'Service') AS ServiceName,
    sc.Name AS ServiceCategory,
    -- Conversation
    (SELECT TOP 1 c.ConversationID FROM messages.Conversations c WHERE c.UserID = b.UserID AND c.VendorProfileID = b.VendorProfileID) AS ConversationID,
    -- Status display labels for UI
    CASE 
        WHEN b.Status IN ('cancelled', 'cancelled_by_client', 'cancelled_by_vendor', 'cancelled_by_admin') THEN 'Cancelled'
        WHEN b.Status = 'declined' THEN 'Declined'
        WHEN b.Status = 'expired' OR (b.Status = 'pending' AND b.ExpiresAt IS NOT NULL AND b.ExpiresAt < GETDATE()) THEN 'Expired'
        WHEN b.EventDate < GETDATE() AND (b.FullAmountPaid = 1 OR b.Status = 'paid' OR b.Status = 'completed') THEN 'Completed'
        WHEN b.FullAmountPaid = 1 OR b.Status = 'paid' THEN 'Confirmed & Paid'
        WHEN b.Status IN ('confirmed', 'approved', 'accepted') THEN 'Awaiting Payment'
        WHEN b.Status = 'pending' THEN 'Awaiting Vendor Approval'
        ELSE b.Status
    END AS StatusLabel,
    -- Status category for filtering
    CASE 
        WHEN b.Status IN ('cancelled', 'cancelled_by_client', 'cancelled_by_vendor', 'cancelled_by_admin') THEN 'cancelled'
        WHEN b.Status = 'declined' THEN 'declined'
        WHEN b.Status = 'expired' OR (b.Status = 'pending' AND b.ExpiresAt IS NOT NULL AND b.ExpiresAt < GETDATE()) THEN 'expired'
        WHEN b.EventDate < GETDATE() AND (b.FullAmountPaid = 1 OR b.Status = 'paid' OR b.Status = 'completed') THEN 'completed'
        WHEN b.EventDate < GETDATE() AND b.Status IN ('confirmed', 'approved', 'accepted') THEN 'completed'
        WHEN (b.FullAmountPaid = 1 OR b.Status = 'paid' OR b.Status IN ('confirmed', 'approved', 'accepted')) AND b.EventDate >= GETDATE() THEN 'upcoming'
        WHEN b.Status = 'pending' THEN 'pending'
        ELSE 'other'
    END AS StatusCategory
FROM bookings.Bookings b
LEFT JOIN users.Users u ON b.UserID = u.UserID
LEFT JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
LEFT JOIN vendors.Services s ON b.ServiceID = s.ServiceID
LEFT JOIN vendors.ServiceCategories sc ON s.CategoryID = sc.CategoryID;
GO

PRINT 'View [bookings].[vw_UnifiedBookings] created successfully.';
GO
