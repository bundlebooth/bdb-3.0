/*
    Migration Script: Create Stored Procedure [sp_UpdateVendorSetupStep]
    Phase: 600 - Stored Procedures
    Script: cu_600_110_dbo.sp_UpdateVendorSetupStep.sql
    Description: Creates the [vendors].[sp_UpdateSetupStep] stored procedure
    
    Execution Order: 110
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_UpdateSetupStep]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpdateSetupStep]'))
    DROP PROCEDURE [vendors].[sp_UpdateSetupStep];
GO

CREATE   PROCEDURE [vendors].[sp_UpdateSetupStep]
    @VendorProfileID INT,
    @Step INT,
    @Field NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles 
    SET SetupStep = @Step,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    -- Update specific completion flag if provided
    IF @Field IS NOT NULL
    BEGIN
        IF @Field = 'gallery'
            UPDATE vendors.VendorProfiles SET GalleryCompleted = 1 WHERE VendorProfileID = @VendorProfileID;
        ELSE IF @Field = 'packages'
            UPDATE vendors.VendorProfiles SET PackagesCompleted = 1 WHERE VendorProfileID = @VendorProfileID;
        ELSE IF @Field = 'services'
            UPDATE vendors.VendorProfiles SET ServicesCompleted = 1 WHERE VendorProfileID = @VendorProfileID;
        ELSE IF @Field = 'social_media'
            UPDATE vendors.VendorProfiles SET SocialMediaCompleted = 1 WHERE VendorProfileID = @VendorProfileID;
        ELSE IF @Field = 'availability'
            UPDATE vendors.VendorProfiles SET AvailabilityCompleted = 1 WHERE VendorProfileID = @VendorProfileID;
    END
    
    -- Check if setup is complete
    UPDATE vendors.VendorProfiles 
    SET SetupCompleted = CASE 
        WHEN GalleryCompleted = 1 AND PackagesCompleted = 1 AND ServicesCompleted = 1 
             AND SocialMediaCompleted = 1 AND AvailabilityCompleted = 1 
        THEN 1 ELSE 0 
    END
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT 1 AS Success;
END;

GO

PRINT 'Stored procedure [vendors].[sp_UpdateSetupStep] created successfully.';
GO

