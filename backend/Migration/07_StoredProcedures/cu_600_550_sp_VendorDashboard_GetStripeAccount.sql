-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_GetStripeAccount
-- Description: Gets vendor's Stripe account ID
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_GetStripeAccount]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_GetStripeAccount];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_GetStripeAccount]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT StripeAccountID FROM vendors.VendorProfiles WHERE VendorProfileID = @VendorProfileID;
END
GO

