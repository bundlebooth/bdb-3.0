-- =============================================
-- Stored Procedure: vendors.sp_GetStripeAccountID
-- Description: Gets Stripe account ID for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetStripeAccountID]'))
    DROP PROCEDURE [vendors].[sp_GetStripeAccountID];
GO

CREATE PROCEDURE [vendors].[sp_GetStripeAccountID]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT StripeAccountID FROM vendors.VendorProfiles WHERE VendorProfileID = @VendorProfileID;
END
GO

