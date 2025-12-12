
-- Stored procedure to save vendor's feature selections (replaces all existing selections)
CREATE   PROCEDURE sp_SaveVendorFeatureSelections
    @VendorProfileID INT,
    @FeatureIds NVARCHAR(MAX) -- Comma-separated list of feature IDs
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Delete existing selections for this vendor
        DELETE FROM VendorSelectedFeatures
        WHERE VendorProfileID = @VendorProfileID;
        
        -- Insert new selections if FeatureIds is not empty
        IF @FeatureIds IS NOT NULL AND LEN(@FeatureIds) > 0
        BEGIN
            INSERT INTO VendorSelectedFeatures (VendorProfileID, FeatureID)
            SELECT @VendorProfileID, CAST(value AS INT)
            FROM STRING_SPLIT(@FeatureIds, ',')
            WHERE RTRIM(value) <> '';
        END
        
        COMMIT TRANSACTION;
        
        -- Get count of selections
        DECLARE @SelectionCount INT;
        SELECT @SelectionCount = COUNT(*) 
        FROM VendorSelectedFeatures 
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

