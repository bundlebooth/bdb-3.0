-- =============================================
-- Stored Procedure: vendors.sp_GetFilters
-- Description: Gets vendor filters/badges
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetFilters]'))
    DROP PROCEDURE [vendors].[sp_GetFilters];
GO

CREATE PROCEDURE [vendors].[sp_GetFilters]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT IsPremium, IsEcoFriendly, IsAwardWinning, IsLastMinute, IsCertified, IsInsured, IsLocal, IsMobile
    FROM vendors.VendorProfiles
    WHERE VendorProfileID = @VendorProfileID;
END
GO

