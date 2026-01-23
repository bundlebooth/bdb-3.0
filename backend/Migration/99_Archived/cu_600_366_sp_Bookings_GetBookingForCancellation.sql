-- Get booking details needed for cancellation processing
CREATE OR ALTER PROCEDURE bookings.sp_GetBookingForCancellation
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        b.BookingID,
        b.UserID,
        b.VendorProfileID,
        b.Status,
        b.EventDate,
        b.TotalAmount,
        b.StripePaymentIntentID,
        b.FullAmountPaid,
        b.CreatedAt,
        
        -- Vendor info
        vp.BusinessName AS VendorName,
        vp.StripeAccountID AS VendorStripeAccountID,
        
        -- Client info
        CONCAT(u.FirstName, ' ', ISNULL(u.LastName, '')) AS ClientName,
        u.Email AS ClientEmail,
        
        -- Cancellation policy
        cp.PolicyID,
        cp.FullRefundHours,
        cp.PartialRefundHours,
        cp.NoRefundHours,
        cp.FullRefundPercent,
        cp.PartialRefundPercent,
        cp.AllowClientCancellation,
        cp.AllowVendorCancellation,
        cp.VendorCancellationPenalty,
        
        -- Calculate hours until event
        DATEDIFF(HOUR, GETDATE(), b.EventDate) AS HoursUntilEvent
        
    FROM bookings.Bookings b
    INNER JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    INNER JOIN users.Users u ON b.UserID = u.UserID
    LEFT JOIN vendors.CancellationPolicies cp ON vp.VendorProfileID = cp.VendorProfileID AND cp.IsActive = 1
    WHERE b.BookingID = @BookingID;
END
GO
