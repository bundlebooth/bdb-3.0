-- =============================================
-- Stored Procedure: sp_Vendor_GetSummary
-- Description: Gets vendor summary for Step 8 display
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_GetSummary]'))
    DROP PROCEDURE [dbo].[sp_Vendor_GetSummary];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_GetSummary]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Basic vendor info
    SELECT 
        BusinessName, DisplayName, BusinessEmail, BusinessPhone, Website,
        YearsInBusiness, BusinessDescription, Tagline, Address, City, State,
        Country, PostalCode, LogoURL
    FROM VendorProfiles 
    WHERE VendorProfileID = @VendorProfileID;
    
    -- Categories
    SELECT vc.Category 
    FROM VendorCategories vc
    WHERE vc.VendorProfileID = @VendorProfileID;
    
    -- Service areas
    SELECT CityName AS City, [State/Province] AS State, Country, ServiceRadius AS RadiusMiles, TravelCost AS AdditionalFee
    FROM VendorServiceAreas 
    WHERE VendorProfileID = @VendorProfileID;
    
    -- Services count
    SELECT COUNT(*) as ServiceCount 
    FROM Services s
    INNER JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID
    WHERE sc.VendorProfileID = @VendorProfileID;
    
    -- Packages count
    SELECT COUNT(*) as PackageCount 
    FROM Packages 
    WHERE VendorProfileID = @VendorProfileID;
    
    -- Images count
    SELECT COUNT(*) as ImageCount 
    FROM VendorImages 
    WHERE VendorProfileID = @VendorProfileID;
    
    -- Social media
    SELECT Platform, URL 
    FROM VendorSocialMedia 
    WHERE VendorProfileID = @VendorProfileID;
    
    -- Business hours
    SELECT DayOfWeek, OpenTime, CloseTime, IsAvailable, Timezone
    FROM VendorBusinessHours 
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY DayOfWeek;
END
GO
