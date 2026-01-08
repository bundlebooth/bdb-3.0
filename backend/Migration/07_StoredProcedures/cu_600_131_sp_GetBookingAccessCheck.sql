-- =============================================
-- Stored Procedure: bookings.sp_GetAccessCheck
-- Description: Checks user access to a booking
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetAccessCheck]'))
    DROP PROCEDURE [bookings].[sp_GetAccessCheck];
GO

CREATE PROCEDURE [bookings].[sp_GetAccessCheck]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT b.UserID AS ClientUserID, vp.UserID AS VendorUserID
    FROM bookings.Bookings b
    JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE b.BookingID = @BookingID;
END
GO


