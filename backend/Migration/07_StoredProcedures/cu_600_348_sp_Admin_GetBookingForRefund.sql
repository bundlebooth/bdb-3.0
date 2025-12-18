-- =============================================
-- Stored Procedure: admin.sp_GetBookingForRefund
-- Description: Gets booking details for refund processing
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetBookingForRefund]'))
    DROP PROCEDURE [admin].[sp_GetBookingForRefund];
GO

CREATE PROCEDURE [admin].[sp_GetBookingForRefund]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT * FROM bookings.Bookings WHERE BookingID = @BookingID;
END
GO

