/*
    Migration Script: Stored Procedure - [email].[sp_GetBookingForCancellation]
    Phase: 600 - Stored Procedures
    Script: cu_600_715_sp_Email_GetBookingForCancellation.sql
    Description: Gets booking details for cancellation email notifications
    
    Execution Order: 715
*/

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF OBJECT_ID('email.sp_GetBookingForCancellation', 'P') IS NOT NULL
    DROP PROCEDURE email.sp_GetBookingForCancellation;
GO

CREATE PROCEDURE email.sp_GetBookingForCancellation
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        b.BookingID,
        b.EventDate,
        b.EventLocation,
        b.Status,
        u.UserID AS ClientUserID,
        CONCAT(u.FirstName, ' ', ISNULL(u.LastName, '')) AS ClientName,
        u.Email AS ClientEmail,
        vp.VendorProfileID,
        vp.BusinessName AS VendorName,
        vp.BusinessEmail AS VendorEmail,
        vu.UserID AS VendorUserID,
        COALESCE(
            (SELECT TOP 1 vs.ServiceName FROM vendors.VendorServices vs 
             JOIN bookings.BookingServices bs ON vs.VendorServiceID = bs.VendorServiceID 
             WHERE bs.BookingID = b.BookingID),
            'Service'
        ) AS ServiceName
    FROM bookings.Bookings b
    INNER JOIN users.Users u ON b.UserID = u.UserID
    INNER JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    LEFT JOIN users.Users vu ON vp.UserID = vu.UserID
    WHERE b.BookingID = @BookingID;
END
GO

PRINT 'Created stored procedure: email.sp_GetBookingForCancellation';
GO
