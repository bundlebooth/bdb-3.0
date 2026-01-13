/*
    Migration Script: Create Stored Procedure [email.sp_GetBookingForPayment]
    Phase: 600 - Stored Procedures
    Description: Gets booking details for payment received email notification
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [email].[sp_GetBookingForPayment]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[email].[sp_GetBookingForPayment]'))
    DROP PROCEDURE [email].[sp_GetBookingForPayment];
GO

CREATE PROCEDURE [email].[sp_GetBookingForPayment]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        b.EventDate,
        b.TotalAmount,
        u.Name AS ClientName,
        vp.BusinessName AS VendorName,
        vu.UserID AS VendorUserID,
        vu.Email AS VendorEmail,
        COALESCE(
            (SELECT TOP 1 s.Name 
             FROM bookings.BookingServices bs 
             INNER JOIN vendors.Services s ON bs.ServiceID = s.ServiceID 
             WHERE bs.BookingID = b.BookingID),
            'Service'
        ) AS ServiceName
    FROM bookings.Bookings b
    INNER JOIN users.Users u ON b.UserID = u.UserID
    INNER JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    INNER JOIN users.Users vu ON vp.UserID = vu.UserID
    WHERE b.BookingID = @BookingID;
END
GO

PRINT 'Stored procedure [email].[sp_GetBookingForPayment] created successfully.';
GO
