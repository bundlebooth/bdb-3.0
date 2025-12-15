-- =============================================
-- Stored Procedure: sp_GetBookingVendorProfileID
-- Description: Gets the VendorProfileID for a booking
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetBookingVendorProfileID]'))
    DROP PROCEDURE [dbo].[sp_GetBookingVendorProfileID];
GO

CREATE PROCEDURE [dbo].[sp_GetBookingVendorProfileID]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT VendorProfileID FROM Bookings WHERE BookingID = @BookingID;
END
GO
