-- =============================================
-- Stored Procedure: payments.sp_GetVendorFromBooking
-- Description: Gets vendor profile ID from booking
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_GetVendorFromBooking]'))
    DROP PROCEDURE [payments].[sp_GetVendorFromBooking];
GO

CREATE PROCEDURE [payments].[sp_GetVendorFromBooking]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT VendorProfileID FROM bookings.Bookings WHERE BookingID = @BookingID;
END
GO

