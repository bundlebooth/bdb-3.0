/*
    Migration Script: Create Stored Procedure [sp_Vendor_UpdateSubcategories]
    Phase: 700 - Stored Procedures
    Script: pb_700_548_sp_Vendor_UpdateSubcategories.sql
    Description: Updates vendor subcategory selections (delete and re-insert pattern)
    
    Execution Order: 548
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_Vendor_UpdateSubcategories]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Vendor_UpdateSubcategories]'))
    DROP PROCEDURE [vendors].[sp_Vendor_UpdateSubcategories];
GO

CREATE PROCEDURE [vendors].[sp_Vendor_UpdateSubcategories]
    @VendorProfileID INT,
    @SubcategoryIDs NVARCHAR(MAX) -- Comma-separated list of SubcategoryIDs
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Delete existing subcategory selections
        DELETE FROM [vendors].[Subcategories]
        WHERE VendorProfileID = @VendorProfileID;
        
        -- Insert new subcategory selections
        IF @SubcategoryIDs IS NOT NULL AND LEN(@SubcategoryIDs) > 0
        BEGIN
            INSERT INTO [vendors].[Subcategories] (VendorProfileID, SubcategoryID, CreatedAt)
            SELECT @VendorProfileID, value, GETUTCDATE()
            FROM STRING_SPLIT(@SubcategoryIDs, ',')
            WHERE ISNUMERIC(value) = 1;
        END
        
        COMMIT TRANSACTION;
        
        SELECT @@ROWCOUNT AS RowsAffected;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

PRINT 'Stored procedure [vendors].[sp_Vendor_UpdateSubcategories] created successfully.';
GO
