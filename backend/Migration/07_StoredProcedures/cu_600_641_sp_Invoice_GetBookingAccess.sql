-- =============================================
-- Stored Procedure: invoices.sp_GetBookingAccess
-- Description: Gets client and vendor user IDs for access control
-- Phase: 600 (Stored Procedures)
-- Schema: invoices
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[invoices].[sp_GetBookingAccess]'))
    DROP PROCEDURE [invoices].[sp_GetBookingAccess];
GO

CREATE PROCEDURE [invoices].[sp_GetBookingAccess]
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


