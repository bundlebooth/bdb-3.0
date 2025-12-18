-- =============================================
-- Stored Procedure: sp_VendorDashboard_GetPopularFilters
-- Description: Gets vendor popular filters
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_GetPopularFilters]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_GetPopularFilters];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_GetPopularFilters]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT IsPremium, IsEcoFriendly, IsAwardWinning, IsLastMinute, IsCertified, IsInsured, IsLocal, IsMobile
    FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID;
END
GO
