-- =============================================
-- Stored Procedure: sp_Admin_GetBookingForRefund
-- Description: Gets booking details for refund processing
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetBookingForRefund]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetBookingForRefund];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetBookingForRefund]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT * FROM Bookings WHERE BookingID = @BookingID;
END
GO
