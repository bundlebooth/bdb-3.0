/*
    Migration Script: Create Stored Procedure [sp_UpsertVendorImage]
    Phase: 600 - Stored Procedures
    Script: cu_600_118_dbo.sp_UpsertVendorImage.sql
    Description: Creates the [dbo].[sp_UpsertVendorImage] stored procedure
    
    Execution Order: 118
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_UpsertVendorImage]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_UpsertVendorImage]'))
    DROP PROCEDURE [dbo].[sp_UpsertVendorImage];
GO

CREATE   PROCEDURE [dbo].[sp_UpsertVendorImage]
    @ImageID INT = NULL, -- NULL for new image, ID for update
    @VendorProfileID INT,
    @ImageURL NVARCHAR(255),
    @IsPrimary BIT = 0,
    @Caption NVARCHAR(255) = NULL,
    @DisplayOrder INT = 0
AS
BEGIN
    SET NOCOUNT ON;

    IF @ImageID IS NULL -- Insert new image
    BEGIN
        INSERT INTO VendorImages (VendorProfileID, ImageURL, IsPrimary, Caption, DisplayOrder)
        VALUES (@VendorProfileID, @ImageURL, @IsPrimary, @Caption, @DisplayOrder);
        SELECT SCOPE_IDENTITY() AS ImageID;
    END
    ELSE -- Update existing image
    BEGIN
        UPDATE VendorImages
        SET
            ImageURL = @ImageURL,
            IsPrimary = @IsPrimary,
            Caption = @Caption,
            DisplayOrder = @DisplayOrder
        WHERE ImageID = @ImageID AND VendorProfileID = @VendorProfileID;
        SELECT @ImageID AS ImageID;
    END

    -- Ensure only one primary image
    IF @IsPrimary = 1
    BEGIN
        UPDATE VendorImages
        SET IsPrimary = 0
        WHERE VendorProfileID = @VendorProfileID AND ImageID != ISNULL(@ImageID, 0);
    END
END;

GO

PRINT 'Stored procedure [dbo].[sp_UpsertVendorImage] created successfully.';
GO
