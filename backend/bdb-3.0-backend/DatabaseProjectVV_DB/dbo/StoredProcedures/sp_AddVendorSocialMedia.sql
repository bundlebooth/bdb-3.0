
-- Add social media link with progress tracking
CREATE   PROCEDURE sp_AddVendorSocialMedia
    @VendorProfileID INT,
    @Platform NVARCHAR(50),
    @URL NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Use MERGE for upsert functionality
    MERGE VendorSocialMedia AS target
    USING (SELECT @VendorProfileID AS VendorProfileID, @Platform AS Platform, @URL AS URL) AS source
    ON target.VendorProfileID = source.VendorProfileID AND target.Platform = source.Platform
    WHEN MATCHED THEN
        UPDATE SET URL = source.URL
    WHEN NOT MATCHED THEN
        INSERT (VendorProfileID, Platform, URL, DisplayOrder)
        VALUES (source.VendorProfileID, source.Platform, source.URL, 
                (SELECT ISNULL(MAX(DisplayOrder), 0) + 1 FROM VendorSocialMedia WHERE VendorProfileID = @VendorProfileID));
    
    -- Update progress
    UPDATE VendorProfiles SET SocialMediaCompleted = 1, SetupStep = CASE WHEN SetupStep < 3 THEN 3 ELSE SetupStep END
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT 1 AS Success, 'Social media link added successfully' AS Message;
END;

GO

