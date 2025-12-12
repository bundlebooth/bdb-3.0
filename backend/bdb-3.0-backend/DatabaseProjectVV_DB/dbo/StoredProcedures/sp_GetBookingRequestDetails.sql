
-- Get request details
CREATE   PROCEDURE sp_GetBookingRequestDetails
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
         FROM Reviews r 
         WHERE r.VendorProfileID = br.VendorProfileID AND r.IsApproved = 1) AS VendorRating,
        (SELECT COUNT(*) 
         FROM Reviews r 
         WHERE r.VendorProfileID = br.VendorProfileID AND r.IsApproved = 1) AS VendorReviewCount
    FROM BookingRequests br
    JOIN Users u ON br.UserID = u.UserID
    JOIN VendorProfiles vp ON br.VendorProfileID = vp.VendorProfileID
    LEFT JOIN Services s ON br.ServiceID = s.ServiceID
    WHERE br.RequestID = @RequestID
        AND (@UserID IS NULL OR br.UserID = @UserID OR vp.UserID = @UserID);
END;

GO

