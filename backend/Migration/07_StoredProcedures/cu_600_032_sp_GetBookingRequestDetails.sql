/*
    Migration Script: Create Stored Procedure [sp_GetBookingRequestDetails]
    Phase: 600 - Stored Procedures
    Script: cu_600_032_dbo.sp_GetBookingRequestDetails.sql
    Description: Creates the [bookings].[sp_GetRequestDetails] stored procedure
    
    Execution Order: 32
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [bookings].[sp_GetRequestDetails]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetRequestDetails]'))
    DROP PROCEDURE [bookings].[sp_GetRequestDetails];
GO

CREATE   PROCEDURE [bookings].[sp_GetRequestDetails]
    @RequestID INT,
    @UserID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        br.RequestID,
        br.UserID,
        u.Name AS ClientName,
        u.Email AS ClientEmail,
        u.Phone AS ClientPhone,
        u.ProfileImageURL AS ClientAvatar,
        br.VendorProfileID,
        vp.BusinessName AS VendorName,
        vp.BusinessEmail AS VendorEmail,
        vp.BusinessPhone AS VendorPhone,
        vp.LogoURL AS VendorImage,
        br.ServiceID,
        s.Name AS ServiceName,
        s.Description AS ServiceDescription,
        s.Price AS ServicePrice,
        br.EventDate,
        br.EventTime,
        br.EventLocation,
        br.AttendeeCount,
        br.Budget,
        br.SpecialRequests,
        br.Services,
        br.Status,
        br.ProposedPrice,
        br.ResponseMessage,
        br.AlternativeDate,
        br.AlternativeTime,
        br.CancellationReason,
        br.CreatedAt,
        br.ExpiresAt,
        br.RespondedAt,
        br.CounterOfferAcceptedAt,
        br.CancelledAt,
        CASE 
            WHEN br.ExpiresAt < GETDATE() AND br.Status = 'pending' THEN 1
            ELSE 0
        END AS IsExpired,
        (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) 
         FROM vendors.Reviews r 
         WHERE r.VendorProfileID = br.VendorProfileID AND r.IsApproved = 1) AS VendorRating,
        (SELECT COUNT(*) 
         FROM vendors.Reviews r 
         WHERE r.VendorProfileID = br.VendorProfileID AND r.IsApproved = 1) AS VendorReviewCount
    FROM bookings.BookingRequests br
    JOIN users.Users u ON br.UserID = u.UserID
    JOIN vendors.VendorProfiles vp ON br.VendorProfileID = vp.VendorProfileID
    LEFT JOIN vendors.Services s ON br.ServiceID = s.ServiceID
    WHERE br.RequestID = @RequestID
        AND (@UserID IS NULL OR br.UserID = @UserID OR vp.UserID = @UserID);
END;

GO

PRINT 'Stored procedure [bookings].[sp_GetRequestDetails] created successfully.';
GO




