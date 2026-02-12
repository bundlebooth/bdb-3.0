-- =============================================
-- Stored Procedure: bookings.sp_GetClientDetailsForQuote
-- Description: Get client details for quote_received email
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetClientDetailsForQuote]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [bookings].[sp_GetClientDetailsForQuote]
GO

CREATE PROCEDURE [bookings].[sp_GetClientDetailsForQuote]
    @RequestID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        u.Email, 
        u.FirstName, 
        u.LastName, 
        v.BusinessName, 
        br.ServiceName, 
        br.EventDate, 
        br.TotalAmount
    FROM bookings.BookingRequests br
    JOIN users.Users u ON br.UserID = u.UserID
    JOIN vendors.VendorProfiles v ON br.VendorProfileID = v.VendorProfileID
    WHERE br.RequestID = @RequestID
END
GO
