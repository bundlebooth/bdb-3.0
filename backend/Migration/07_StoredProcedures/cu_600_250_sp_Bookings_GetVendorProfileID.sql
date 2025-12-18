-- =============================================
-- Stored Procedure: sp_Bookings_GetVendorProfileID
-- Description: Gets VendorProfileID from a booking
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Bookings_GetVendorProfileID]'))
    DROP PROCEDURE [dbo].[sp_Bookings_GetVendorProfileID];
GO

CREATE PROCEDURE [dbo].[sp_Bookings_GetVendorProfileID]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT VendorProfileID FROM Bookings WHERE BookingID = @BookingID;
END
GO
