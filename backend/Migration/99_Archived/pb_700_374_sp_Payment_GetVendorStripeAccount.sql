-- =============================================
-- Stored Procedure: payments.sp_GetVendorStripeAccount
-- Description: Gets vendor's Stripe account ID
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_GetVendorStripeAccount]'))
    DROP PROCEDURE [payments].[sp_GetVendorStripeAccount];
GO

CREATE PROCEDURE [payments].[sp_GetVendorStripeAccount]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT StripeAccountID 
    FROM vendors.VendorProfiles 
    WHERE VendorProfileID = @VendorProfileID;
END
GO

