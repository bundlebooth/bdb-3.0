/*
    Migration Script: Create Stored Procedure [sp_SaveVendorFeatureSelections]
    Phase: 600 - Stored Procedures
    Script: cu_600_088_dbo.sp_SaveVendorFeatureSelections.sql
    Description: Creates the [vendors].[sp_SaveFeatureSelections] stored procedure
    
    Execution Order: 88
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_SaveFeatureSelections]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_SaveFeatureSelections]'))
    DROP PROCEDURE [vendors].[sp_SaveFeatureSelections];
GO

CREATE   PROCEDURE [vendors].[sp_SaveFeatureSelections]
    @VendorProfileID INT,
    @FeatureIds NVARCHAR(MAX) -- Comma-separated list of feature IDs
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Delete existing selections for this vendor
        DELETE FROM vendors.VendorSelectedFeatures
        WHERE VendorProfileID = @VendorProfileID;
        
        -- Insert new selections if FeatureIds is not empty
        IF @FeatureIds IS NOT NULL AND LEN(@FeatureIds) > 0
        BEGIN
            INSERT INTO vendors.VendorSelectedFeatures (VendorProfileID, FeatureID)
            SELECT @VendorProfileID, CAST(value AS INT)
            FROM STRING_SPLIT(@FeatureIds, ',')
            WHERE RTRIM(value) <> '';
        END
        
        COMMIT TRANSACTION;
        
        -- Get count of selections
        DECLARE @SelectionCount INT;
        SELECT @SelectionCount = COUNT(*) 
        FROM vendors.VendorSelectedFeatures 
        WHERE VendorProfileID = @VendorProfileID;
        
        SELECT 'success' AS Status, 'Feature selections saved successfully' AS Message, @SelectionCount AS SelectionCount;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        SELECT 'error' AS Status, ERROR_MESSAGE() AS Message, 0 AS SelectionCount;
    END CATCH
END

GO

PRINT 'Stored procedure [vendors].[sp_SaveFeatureSelections] created successfully.';
GO

