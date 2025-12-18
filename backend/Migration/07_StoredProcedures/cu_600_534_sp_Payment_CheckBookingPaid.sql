-- =============================================
-- Stored Procedure: payments.sp_CheckBookingPaid
-- Description: Checks if booking is already paid
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_CheckBookingPaid]'))
    DROP PROCEDURE [payments].[sp_CheckBookingPaid];
GO

CREATE PROCEDURE [payments].[sp_CheckBookingPaid]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT FullAmountPaid FROM bookings.Bookings WHERE BookingID = @BookingID;
END
GO

