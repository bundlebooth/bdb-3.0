-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_GetPopularFilters
-- Description: Gets vendor popular filters
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_GetPopularFilters]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_GetPopularFilters];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_GetPopularFilters]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT IsPremium, IsEcoFriendly, IsAwardWinning, IsLastMinute, IsCertified, IsInsured, IsLocal, IsMobile
    FROM vendors.VendorProfiles WHERE VendorProfileID = @VendorProfileID;
END
GO

