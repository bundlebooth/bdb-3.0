-- =============================================
-- Stored Procedure: sp_Vendor_GetStripeAccountId
-- Description: Gets vendor's Stripe account ID
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_GetStripeAccountId]'))
    DROP PROCEDURE [dbo].[sp_Vendor_GetStripeAccountId];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_GetStripeAccountId]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT StripeAccountID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID;
END
GO
