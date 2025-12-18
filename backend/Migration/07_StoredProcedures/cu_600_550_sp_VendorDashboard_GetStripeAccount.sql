-- =============================================
-- Stored Procedure: sp_VendorDashboard_GetStripeAccount
-- Description: Gets vendor's Stripe account ID
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_GetStripeAccount]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_GetStripeAccount];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_GetStripeAccount]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT StripeAccountID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID;
END
GO
