/*
    Migration Script: Create Stored Procedure [bookings].[sp_GetVendorRequests]
    Description: Creates the [bookings].[sp_GetVendorRequests] stored procedure
*/

SET NOCOUNT ON;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetVendorRequests]'))
    DROP PROCEDURE [bookings].[sp_GetVendorRequests];
GO


CREATE PROCEDURE [bookings].[sp_GetVendorRequests]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM bookings.vw_UnifiedBookings WHERE VendorProfileID = @VendorProfileID AND UnifiedStatus = 'pending' ORDER BY EventDate DESC;
END;
GO
