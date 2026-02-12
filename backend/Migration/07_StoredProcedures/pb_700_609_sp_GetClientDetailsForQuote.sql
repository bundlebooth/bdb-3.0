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
        s.Name AS ServiceName, 
        b.EventDate, 
        b.TotalAmount
    FROM bookings.Bookings b
    JOIN users.Users u ON b.UserID = u.UserID
    JOIN vendors.VendorProfiles v ON b.VendorProfileID = v.VendorProfileID
    LEFT JOIN vendors.Services s ON b.ServiceID = s.ServiceID
    WHERE b.RequestID = @RequestID
END
GO
