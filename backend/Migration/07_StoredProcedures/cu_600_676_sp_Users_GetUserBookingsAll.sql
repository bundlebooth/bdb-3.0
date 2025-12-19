/*
    Migration Script: Create Stored Procedure [users].[sp_GetUserBookingsAll]
    Phase: 600 - Stored Procedures
    Script: cu_600_676_sp_Users_GetUserBookingsAll.sql
    Description: Creates the [users].[sp_GetUserBookingsAll] stored procedure
                 Used by GET /api/users/:id/bookings/all endpoint
    
    Execution Order: 676
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [users].[sp_GetUserBookingsAll]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetUserBookingsAll]'))
    DROP PROCEDURE [users].[sp_GetUserBookingsAll];
GO

CREATE PROCEDURE [users].[sp_GetUserBookingsAll]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        b.BookingID,
        b.UserID,
        b.VendorProfileID,
        b.ServiceID,
        b.BookingDate,
        b.EventDate,
        b.EndDate,
        b.Status,
        b.TotalAmount,
        b.DepositAmount,
        b.DepositPaid,
        b.FullAmountPaid,
        b.AttendeeCount,
        b.SpecialRequests,
        b.CancellationDate,
        b.RefundAmount,
        b.StripePaymentIntentID,
        b.CreatedAt,
        b.UpdatedAt,
        b.EventLocation,
        b.EventName,
        b.EventType,
        b.TimeZone,
        vp.BusinessName AS VendorName,
        vp.BusinessEmail AS VendorEmail,
        vp.BusinessPhone AS VendorPhone,
        vp.LogoURL AS VendorLogo
    FROM bookings.Bookings b
    INNER JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE b.UserID = @UserID
    ORDER BY b.EventDate DESC;
END;

GO

PRINT 'Stored procedure [users].[sp_GetUserBookingsAll] created successfully.';
GO
