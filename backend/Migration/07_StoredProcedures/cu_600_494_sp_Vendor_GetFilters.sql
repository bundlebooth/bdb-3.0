-- =============================================
-- Stored Procedure: sp_Vendor_GetFilters
-- Description: Gets vendor filters/badges
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_GetFilters]'))
    DROP PROCEDURE [dbo].[sp_Vendor_GetFilters];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_GetFilters]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT IsPremium, IsEcoFriendly, IsAwardWinning, IsLastMinute, IsCertified, IsInsured, IsLocal, IsMobile
    FROM VendorProfiles
    WHERE VendorProfileID = @VendorProfileID;
END
GO
