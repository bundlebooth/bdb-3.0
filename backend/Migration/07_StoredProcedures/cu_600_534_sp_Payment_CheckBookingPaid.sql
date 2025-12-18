-- =============================================
-- Stored Procedure: sp_Payment_CheckBookingPaid
-- Description: Checks if booking is already paid
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Payment_CheckBookingPaid]'))
    DROP PROCEDURE [dbo].[sp_Payment_CheckBookingPaid];
GO

CREATE PROCEDURE [dbo].[sp_Payment_CheckBookingPaid]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT FullAmountPaid FROM Bookings WHERE BookingID = @BookingID;
END
GO
