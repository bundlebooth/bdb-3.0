-- =============================================
-- Stored Procedure: sp_Invoice_GetBookingAccess
-- Description: Gets client and vendor user IDs for access control
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Invoice_GetBookingAccess]'))
    DROP PROCEDURE [dbo].[sp_Invoice_GetBookingAccess];
GO

CREATE PROCEDURE [dbo].[sp_Invoice_GetBookingAccess]
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
