-- =============================================
-- Stored Procedure: bookings.sp_GetVendorProfileID
-- Description: Gets VendorProfileID from a booking
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetVendorProfileID]'))
    DROP PROCEDURE [bookings].[sp_GetVendorProfileID];
GO

CREATE PROCEDURE [bookings].[sp_GetVendorProfileID]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT VendorProfileID FROM bookings.Bookings WHERE BookingID = @BookingID;
END
GO

