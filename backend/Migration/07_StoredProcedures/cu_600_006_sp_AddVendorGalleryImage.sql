/*
    Migration Script: Create Stored Procedure [sp_AddVendorGalleryImage]
    Phase: 600 - Stored Procedures
    Script: cu_600_006_dbo.sp_AddVendorGalleryImage.sql
    Description: Creates the [dbo].[sp_AddVendorGalleryImage] stored procedure
    
    Execution Order: 6
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_AddVendorGalleryImage]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_AddVendorGalleryImage]'))
    DROP PROCEDURE [dbo].[sp_AddVendorGalleryImage];
GO

CREATE   PROCEDURE [dbo].[sp_AddVendorGalleryImage]
    @VendorProfileID INT,
    @ImageURL NVARCHAR(500),
    @CloudinaryPublicId NVARCHAR(200) = NULL,
    @CloudinaryUrl NVARCHAR(500) = NULL,
    @CloudinarySecureUrl NVARCHAR(500) = NULL,
    @CloudinaryTransformations NVARCHAR(MAX) = NULL,
    @IsPrimary BIT = 0,
    @DisplayOrder INT = NULL,
    @ImageType NVARCHAR(20) = 'Gallery',
    @Caption NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- If setting as primary, remove primary from others
        IF @IsPrimary = 1
        BEGIN
            UPDATE VendorImages 
            SET IsPrimary = 0 
            WHERE VendorProfileID = @VendorProfileID;
        END
        
        -- Set display order if not provided
        IF @DisplayOrder IS NULL
        BEGIN
            SELECT @DisplayOrder = ISNULL(MAX(DisplayOrder), 0) + 1
            FROM VendorImages
            WHERE VendorProfileID = @VendorProfileID;
        END
        
        -- Insert new image with enhanced Cloudinary support
        INSERT INTO VendorImages (
            VendorProfileID,
            ImageURL,
            CloudinaryPublicId,
            CloudinaryUrl,
            CloudinarySecureUrl,
            CloudinaryTransformations,
            IsPrimary,
            DisplayOrder,
            ImageType,
            Caption,
            CreatedAt
        )
        VALUES (
            @VendorProfileID,
            @ImageURL,
            @CloudinaryPublicId,
            @CloudinaryUrl,
            @CloudinarySecureUrl,
            @CloudinaryTransformations,
            @IsPrimary,
            @DisplayOrder,
            @ImageType,
            @Caption,
            GETDATE()
        );
        
        DECLARE @ImageID INT = SCOPE_IDENTITY();
        
        -- Update vendor featured image if this is primary
        IF @IsPrimary = 1
        BEGIN
            UPDATE VendorProfiles 
            SET LogoURL = COALESCE(@CloudinarySecureUrl, @CloudinaryUrl, @ImageURL),
                UpdatedAt = GETDATE()
            WHERE VendorProfileID = @VendorProfileID;
        END
        
        -- Update setup progress
        UPDATE VendorProfiles 
        SET SetupStep6Completed = 1,
            UpdatedAt = GETDATE()
        WHERE VendorProfileID = @VendorProfileID;
        
        COMMIT TRANSACTION;
        
        SELECT 1 AS Success, 'Image added successfully' AS Message, @ImageID AS ImageID;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT 0 AS Success, ERROR_MESSAGE() AS Message, NULL AS ImageID;
    END CATCH
END;

GO

PRINT 'Stored procedure [dbo].[sp_AddVendorGalleryImage] created successfully.';
GO
