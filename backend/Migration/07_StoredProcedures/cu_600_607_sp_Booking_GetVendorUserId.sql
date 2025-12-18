-- =============================================
-- Stored Procedure: bookings.sp_GetVendorUserId
-- Description: Gets vendor's user ID from vendor profile
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetVendorUserId]'))
    DROP PROCEDURE [bookings].[sp_GetVendorUserId];
GO

CREATE PROCEDURE [bookings].[sp_GetVendorUserId]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT UserID FROM vendors.VendorProfiles WHERE VendorProfileID = @VendorProfileID;
END
GO

