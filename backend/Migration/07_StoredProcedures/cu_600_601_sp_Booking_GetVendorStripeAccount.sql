-- =============================================
-- Stored Procedure: sp_Booking_GetVendorStripeAccount
-- Description: Gets vendor's Stripe account ID
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Booking_GetVendorStripeAccount]'))
    DROP PROCEDURE [dbo].[sp_Booking_GetVendorStripeAccount];
GO

CREATE PROCEDURE [dbo].[sp_Booking_GetVendorStripeAccount]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT StripeAccountID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID;
END
GO
