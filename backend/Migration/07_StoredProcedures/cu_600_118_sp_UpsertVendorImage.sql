/*
    Migration Script: Create Stored Procedure [sp_UpsertVendorImage]
    Phase: 600 - Stored Procedures
    Script: cu_600_118_dbo.sp_UpsertVendorImage.sql
    Description: Creates the [vendors].[sp_UpsertImage] stored procedure
    
    Execution Order: 118
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_UpsertImage]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpsertImage]'))
    DROP PROCEDURE [vendors].[sp_UpsertImage];
GO

CREATE   PROCEDURE [vendors].[sp_UpsertImage]
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
        INSERT INTO vendors.VendorImages (VendorProfileID, ImageURL, IsPrimary, Caption, DisplayOrder)
        VALUES (@VendorProfileID, @ImageURL, @IsPrimary, @Caption, @DisplayOrder);
        SELECT SCOPE_IDENTITY() AS ImageID;
    END
    ELSE -- Update existing image
    BEGIN
        UPDATE vendors.VendorImages
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
        UPDATE vendors.VendorImages
        SET IsPrimary = 0
        WHERE VendorProfileID = @VendorProfileID AND ImageID != ISNULL(@ImageID, 0);
    END
END;

GO

PRINT 'Stored procedure [vendors].[sp_UpsertImage] created successfully.';
GO

