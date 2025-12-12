
-- Update vendor setup step
CREATE   PROCEDURE sp_UpdateVendorSetupStep
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

