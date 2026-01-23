/*
    Migration Script: Create Stored Procedure [bookings].[sp_GetBookingForCancellation]
    Description: Gets booking details needed for cancellation processing
                 Uses VendorCancellationPolicies table
    
    Execution Order: 715
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [bookings].[sp_GetBookingForCancellation]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetBookingForCancellation]'))
    DROP PROCEDURE [bookings].[sp_GetBookingForCancellation];
GO

CREATE PROCEDURE [bookings].[sp_GetBookingForCancellation]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        b.BookingID,
        b.UserID,
        b.VendorProfileID,
        b.EventDate,
        b.TotalAmount,
        b.DepositAmount,
        b.DepositPaid,
        b.FullAmountPaid,
        b.Status,
        b.StripePaymentIntentID,
        cp.PolicyID,
        cp.PolicyName,
        cp.FullRefundHours,
        cp.PartialRefundHours,
        cp.NoRefundHours,
        cp.PartialRefundPercent,
        cp.AllowClientCancellation,
        cp.AllowVendorCancellation
    FROM bookings.Bookings b
    LEFT JOIN vendors.VendorCancellationPolicies cp ON b.VendorProfileID = cp.VendorProfileID AND cp.IsActive = 1
    WHERE b.BookingID = @BookingID;
END;
GO

PRINT 'Stored procedure [bookings].[sp_GetBookingForCancellation] created successfully.';
GO
