-- =============================================
-- Stored Procedure: admin.sp_GetVendorStripeAccount
-- Description: Gets vendor Stripe account ID
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetVendorStripeAccount]'))
    DROP PROCEDURE [admin].[sp_GetVendorStripeAccount];
GO

CREATE PROCEDURE [admin].[sp_GetVendorStripeAccount]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT StripeAccountId 
    FROM vendors.VendorProfiles 
    WHERE VendorProfileID = @VendorProfileID;
END
GO

