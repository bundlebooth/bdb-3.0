-- =============================================
-- Stored Procedure: bookings.sp_GetVendorStripeAccount
-- Description: Gets vendor's Stripe account ID
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetVendorStripeAccount]'))
    DROP PROCEDURE [bookings].[sp_GetVendorStripeAccount];
GO

CREATE PROCEDURE [bookings].[sp_GetVendorStripeAccount]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT StripeAccountID FROM vendors.VendorProfiles WHERE VendorProfileID = @VendorProfileID;
END
GO

