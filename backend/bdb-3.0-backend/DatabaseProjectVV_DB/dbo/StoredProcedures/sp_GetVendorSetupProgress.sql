
-- Get vendor setup progress
CREATE   PROCEDURE sp_GetVendorSetupProgress
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
        (SELECT COUNT(*) FROM VendorImages WHERE VendorProfileID = @VendorProfileID) AS GalleryCount,
        (SELECT COUNT(*) FROM Services s 
         JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID 
         WHERE sc.VendorProfileID = @VendorProfileID AND s.ServiceType = 'Package') AS PackagesCount,
        (SELECT COUNT(*) FROM Services s 
         JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID 
         WHERE sc.VendorProfileID = @VendorProfileID AND s.ServiceType = 'Service') AS ServicesCount,
        (SELECT COUNT(*) FROM VendorSocialMedia WHERE VendorProfileID = @VendorProfileID) AS SocialMediaCount,
        (SELECT COUNT(*) FROM VendorBusinessHours WHERE VendorProfileID = @VendorProfileID) AS AvailabilityCount
    FROM VendorProfiles 
    WHERE VendorProfileID = @VendorProfileID;
END;

GO

