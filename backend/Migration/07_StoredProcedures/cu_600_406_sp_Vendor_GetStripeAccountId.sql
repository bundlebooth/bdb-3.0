-- =============================================
-- Stored Procedure: vendors.sp_GetStripeAccountId
-- Description: Gets vendor's Stripe account ID
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetStripeAccountId]'))
    DROP PROCEDURE [vendors].[sp_GetStripeAccountId];
GO

CREATE PROCEDURE [vendors].[sp_GetStripeAccountId]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT StripeAccountID FROM vendors.VendorProfiles WHERE VendorProfileID = @VendorProfileID;
END
GO

