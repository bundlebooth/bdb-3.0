/*
    Migration Script: Create Stored Procedure [sp_UpdateVendorSetupStep]
    Phase: 600 - Stored Procedures
    Script: cu_600_110_dbo.sp_UpdateVendorSetupStep.sql
    Description: Creates the [dbo].[sp_UpdateVendorSetupStep] stored procedure
    
    Execution Order: 110
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_UpdateVendorSetupStep]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_UpdateVendorSetupStep]'))
    DROP PROCEDURE [dbo].[sp_UpdateVendorSetupStep];
GO

CREATE   PROCEDURE [dbo].[sp_UpdateVendorSetupStep]
    @VendorProfileID INT,
    @Step INT,
    @Field NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles 
    SET SetupStep = @Step,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    -- Update specific completion flag if provided
    IF @Field IS NOT NULL
    BEGIN
        IF @Field = 'gallery'
            UPDATE VendorProfiles SET GalleryCompleted = 1 WHERE VendorProfileID = @VendorProfileID;
        ELSE IF @Field = 'packages'
            UPDATE VendorProfiles SET PackagesCompleted = 1 WHERE VendorProfileID = @VendorProfileID;
        ELSE IF @Field = 'services'
            UPDATE VendorProfiles SET ServicesCompleted = 1 WHERE VendorProfileID = @VendorProfileID;
        ELSE IF @Field = 'social_media'
            UPDATE VendorProfiles SET SocialMediaCompleted = 1 WHERE VendorProfileID = @VendorProfileID;
        ELSE IF @Field = 'availability'
            UPDATE VendorProfiles SET AvailabilityCompleted = 1 WHERE VendorProfileID = @VendorProfileID;
    END
    
    -- Check if setup is complete
    UPDATE VendorProfiles 
    SET SetupCompleted = CASE 
        WHEN GalleryCompleted = 1 AND PackagesCompleted = 1 AND ServicesCompleted = 1 
             AND SocialMediaCompleted = 1 AND AvailabilityCompleted = 1 
        THEN 1 ELSE 0 
    END
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT 1 AS Success;
END;

GO

PRINT 'Stored procedure [dbo].[sp_UpdateVendorSetupStep] created successfully.';
GO
