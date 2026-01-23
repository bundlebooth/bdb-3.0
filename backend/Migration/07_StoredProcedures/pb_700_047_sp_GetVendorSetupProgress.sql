/*
    Migration Script: Create Stored Procedure [sp_GetVendorSetupProgress]
    Phase: 600 - Stored Procedures
    Script: cu_600_079_dbo.sp_GetVendorSetupProgress.sql
    Description: Creates the [vendors].[sp_GetSetupProgress] stored procedure
    
    Execution Order: 79
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetSetupProgress]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetSetupProgress]'))
    DROP PROCEDURE [vendors].[sp_GetSetupProgress];
GO

CREATE   PROCEDURE [vendors].[sp_GetSetupProgress]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        ISNULL(SetupStep, 1) AS SetupStep,
        ISNULL(SetupCompleted, 0) AS SetupCompleted,
        ISNULL(GalleryCompleted, 0) AS GalleryCompleted,
        ISNULL(PackagesCompleted, 0) AS PackagesCompleted,
        ISNULL(ServicesCompleted, 0) AS ServicesCompleted,
        ISNULL(SocialMediaCompleted, 0) AS SocialMediaCompleted,
        ISNULL(AvailabilityCompleted, 0) AS AvailabilityCompleted,
        (SELECT COUNT(*) FROM vendors.VendorImages WHERE VendorProfileID = @VendorProfileID) AS GalleryCount,
        (SELECT COUNT(*) FROM vendors.Services s 
         JOIN vendors.ServiceCategories sc ON s.CategoryID = sc.CategoryID 
         WHERE sc.VendorProfileID = @VendorProfileID AND s.ServiceType = 'Package') AS PackagesCount,
        (SELECT COUNT(*) FROM vendors.Services s 
         JOIN vendors.ServiceCategories sc ON s.CategoryID = sc.CategoryID 
         WHERE sc.VendorProfileID = @VendorProfileID AND s.ServiceType = 'Service') AS ServicesCount,
        (SELECT COUNT(*) FROM vendors.VendorSocialMedia WHERE VendorProfileID = @VendorProfileID) AS SocialMediaCount,
        (SELECT COUNT(*) FROM vendors.VendorBusinessHours WHERE VendorProfileID = @VendorProfileID) AS AvailabilityCount
    FROM vendors.VendorProfiles 
    WHERE VendorProfileID = @VendorProfileID;
END;

GO

PRINT 'Stored procedure [vendors].[sp_GetSetupProgress] created successfully.';
GO




