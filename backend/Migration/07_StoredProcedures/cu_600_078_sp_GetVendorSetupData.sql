/*
    Migration Script: Create Stored Procedure [sp_GetVendorSetupData]
    Phase: 600 - Stored Procedures
    Script: cu_600_078_dbo.sp_GetVendorSetupData.sql
    Description: Creates the [vendors].[sp_GetSetupData] stored procedure
    
    Execution Order: 78
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetSetupData]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetSetupData]'))
    DROP PROCEDURE [vendors].[sp_GetSetupData];
GO

CREATE   PROCEDURE [vendors].[sp_GetSetupData]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Vendor basic info
    SELECT 
        VendorProfileID,
        BusinessName,
        ISNULL(SetupStep, 1) AS SetupStep,
        ISNULL(SetupCompleted, 0) AS SetupCompleted
    FROM vendors.VendorProfiles 
    WHERE VendorProfileID = @VendorProfileID;
    
    -- Gallery images FROM vendors.VendorImages
    SELECT 
        ImageID,
        ImageURL,
        ISNULL(ImageType, 'upload') AS ImageType,
        Caption,
        DisplayOrder AS SortOrder
    FROM vendors.VendorImages 
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY DisplayOrder;
    
    -- Packages FROM vendors.Services table (Packages category)
    SELECT 
        s.ServiceID AS PackageID,
        s.Name AS PackageName,
        s.Description,
        s.Price,
        CAST(s.DurationMinutes/60 AS NVARCHAR(10)) + ' hours' AS Duration,
        s.MaxAttendees AS MaxGuests,
        s.IsActive
    FROM vendors.Services s
    JOIN vendors.ServiceCategories sc ON s.CategoryID = sc.CategoryID
    WHERE sc.VendorProfileID = @VendorProfileID AND s.ServiceType = 'Package' AND s.IsActive = 1
    ORDER BY s.CreatedAt;
    
    -- Services FROM vendors.Services table (non-Packages categories)
    SELECT 
        s.ServiceID,
        s.Name AS ServiceName,
        s.Description,
        s.Price,
        s.DurationMinutes,
        sc.Name AS CategoryName,
        s.IsActive
    FROM vendors.Services s
    JOIN vendors.ServiceCategories sc ON s.CategoryID = sc.CategoryID
    WHERE sc.VendorProfileID = @VendorProfileID AND s.ServiceType = 'Service' AND s.IsActive = 1
    ORDER BY s.CreatedAt;
    
    -- Social Media FROM vendors.VendorSocialMedia
    SELECT 
        SocialID AS SocialMediaSetupID,
        Platform,
        URL
    FROM vendors.VendorSocialMedia 
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY Platform;
    
    -- Availability FROM vendors.VendorBusinessHours
    SELECT 
        HoursID AS AvailabilitySetupID,
        DayOfWeek,
        OpenTime AS StartTime,
        CloseTime AS EndTime,
        IsAvailable
    FROM vendors.VendorBusinessHours 
    WHERE VendorProfileID = @VendorProfileID AND IsAvailable = 1
    ORDER BY DayOfWeek;
END;

GO

PRINT 'Stored procedure [vendors].[sp_GetSetupData] created successfully.';
GO




