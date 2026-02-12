-- =============================================
-- Stored Procedure: bookings.sp_GetBookingDetails
-- Description: Get booking details for various operations
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetBookingDetails]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [bookings].[sp_GetBookingDetails]
GO

CREATE PROCEDURE [bookings].[sp_GetBookingDetails]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        b.BookingID,
        b.UserID,
        b.VendorProfileID,
        b.ServiceName,
        b.EventDate,
        b.EventTime,
        b.EventEndTime,
        b.EventLocation,
        b.Status,
        b.TotalAmount,
        b.Subtotal,
        b.PlatformFee,
        b.TaxAmount,
        b.ProcessingFee,
        b.GrandTotal,
        b.Notes,
        b.CreatedAt,
        b.UpdatedAt,
        u.Email AS ClientEmail,
        u.FirstName AS ClientFirstName,
        u.LastName AS ClientLastName,
        v.BusinessName,
        v.ContactEmail AS VendorEmail,
        vu.UserID AS VendorUserID
    FROM bookings.Bookings b
    JOIN users.Users u ON b.UserID = u.UserID
    JOIN vendors.VendorProfiles v ON b.VendorProfileID = v.VendorProfileID
    JOIN users.Users vu ON v.UserID = vu.UserID
    WHERE b.BookingID = @BookingID
END
GO
