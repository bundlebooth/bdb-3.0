-- =============================================
-- Stored Procedure: vendors.sp_UpdateStripeAccountID
-- Description: Updates Stripe account ID for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpdateStripeAccountID]'))
    DROP PROCEDURE [vendors].[sp_UpdateStripeAccountID];
GO

CREATE PROCEDURE [vendors].[sp_UpdateStripeAccountID]
    @VendorProfileID INT,
    @StripeAccountID NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles 
    SET StripeAccountID = @StripeAccountID, UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

