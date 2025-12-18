-- =============================================
-- Stored Procedure: sp_VendorDashboard_GetAllBookings
-- Description: Gets all bookings for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_GetAllBookings]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_GetAllBookings];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_GetAllBookings]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        b.BookingID,
        b.VendorProfileID,
        b.UserID,
        u.Name AS ClientName,
        u.Email AS ClientEmail,
        u.Phone AS ClientPhone,
        b.EventDate,
        b.EndDate,
        b.Status,
        b.TotalAmount,
        b.DepositAmount,
        b.DepositPaid,
        b.FullAmountPaid,
        b.AttendeeCount,
        b.SpecialRequests,
        b.EventLocation AS Location,
        b.EventName,
        b.EventType,
        b.TimeZone,
        b.CreatedAt,
        b.UpdatedAt,
        (SELECT TOP 1 c.ConversationID FROM Conversations c WHERE c.UserID = b.UserID AND c.VendorProfileID = b.VendorProfileID) AS ConversationID,
        COALESCE(
            (SELECT TOP 1 s.Name FROM BookingServices bs 
             INNER JOIN Services s ON bs.ServiceID = s.ServiceID 
             WHERE bs.BookingID = b.BookingID ORDER BY bs.BookingServiceID),
            'Service'
        ) AS ServiceName
    FROM Bookings b
    LEFT JOIN Users u ON b.UserID = u.UserID
    WHERE b.VendorProfileID = @VendorProfileID
    ORDER BY b.EventDate DESC;
END
GO
