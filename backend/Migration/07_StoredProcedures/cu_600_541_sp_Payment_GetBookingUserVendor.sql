-- =============================================
-- Stored Procedure: sp_Payment_GetBookingUserVendor
-- Description: Gets user and vendor IDs from booking
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Payment_GetBookingUserVendor]'))
    DROP PROCEDURE [dbo].[sp_Payment_GetBookingUserVendor];
GO

CREATE PROCEDURE [dbo].[sp_Payment_GetBookingUserVendor]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT UserID, VendorProfileID, TotalAmount FROM Bookings WHERE BookingID = @BookingID;
END
GO
