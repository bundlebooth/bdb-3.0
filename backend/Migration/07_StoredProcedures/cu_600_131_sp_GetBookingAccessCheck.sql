-- =============================================
-- Stored Procedure: sp_GetBookingAccessCheck
-- Description: Checks user access to a booking
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetBookingAccessCheck]'))
    DROP PROCEDURE [dbo].[sp_GetBookingAccessCheck];
GO

CREATE PROCEDURE [dbo].[sp_GetBookingAccessCheck]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT b.UserID AS ClientUserID, vp.UserID AS VendorUserID
    FROM Bookings b
    JOIN VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE b.BookingID = @BookingID;
END
GO
