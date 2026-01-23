-- =============================================
-- Stored Procedure: vendors.sp_GetSummary
-- Description: Gets vendor summary for Step 8 display
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetSummary]'))
    DROP PROCEDURE [vendors].[sp_GetSummary];
GO

CREATE PROCEDURE [vendors].[sp_GetSummary]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Basic vendor info
    SELECT 
        BusinessName, DisplayName, BusinessEmail, BusinessPhone, Website,
        YearsInBusiness, BusinessDescription, Tagline, Address, City, State,
        Country, PostalCode, LogoURL
    FROM vendors.VendorProfiles 
    WHERE VendorProfileID = @VendorProfileID;
    
    -- Categories
    SELECT vc.Category 
    FROM vendors.VendorCategories vc
    WHERE vc.VendorProfileID = @VendorProfileID;
    
    -- Service areas
    SELECT CityName AS City, [State/Province] AS State, Country, ServiceRadius AS RadiusMiles, TravelCost AS AdditionalFee
    FROM VendorServiceAreas 
    WHERE VendorProfileID = @VendorProfileID;
    
    -- Services count
    SELECT COUNT(*) as ServiceCount 
    FROM vendors.Services s
    INNER JOIN vendors.ServiceCategories sc ON s.CategoryID = sc.CategoryID
    WHERE sc.VendorProfileID = @VendorProfileID;
    
    -- Packages count
    SELECT COUNT(*) as PackageCount 
    FROM Packages 
    WHERE VendorProfileID = @VendorProfileID;
    
    -- Images count
    SELECT COUNT(*) as ImageCount 
    FROM vendors.VendorImages 
    WHERE VendorProfileID = @VendorProfileID;
    
    -- Social media
    SELECT Platform, URL 
    FROM vendors.VendorSocialMedia 
    WHERE VendorProfileID = @VendorProfileID;
    
    -- Business hours
    SELECT DayOfWeek, OpenTime, CloseTime, IsAvailable, Timezone
    FROM vendors.VendorBusinessHours 
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY DayOfWeek;
END
GO





