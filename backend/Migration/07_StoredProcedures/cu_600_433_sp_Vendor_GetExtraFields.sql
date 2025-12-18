-- =============================================
-- Stored Procedure: sp_Vendor_GetExtraFields
-- Description: Gets extra profile fields including Stripe, Google, and filters
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_GetExtraFields]'))
    DROP PROCEDURE [dbo].[sp_Vendor_GetExtraFields];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_GetExtraFields]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT StripeAccountID, GooglePlaceId, IsPremium, 
           IsEcoFriendly, IsAwardWinning, IsLastMinute, IsCertified, IsInsured
    FROM VendorProfiles
    WHERE VendorProfileID = @VendorProfileID;
END
GO
