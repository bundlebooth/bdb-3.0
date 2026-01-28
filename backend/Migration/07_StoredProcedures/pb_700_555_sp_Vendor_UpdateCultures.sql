/*
    Migration Script: Create Stored Procedure [sp_Vendor_UpdateCultures]
    Phase: 700 - Stored Procedures
    Script: pb_700_555_sp_Vendor_UpdateCultures.sql
    Description: Updates vendor culture selections (delete and re-insert pattern)
    
    Execution Order: 555
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_Vendor_UpdateCultures]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Vendor_UpdateCultures]'))
    DROP PROCEDURE [vendors].[sp_Vendor_UpdateCultures];
GO

CREATE PROCEDURE [vendors].[sp_Vendor_UpdateCultures]
    @VendorProfileID INT,
    @CultureIDs NVARCHAR(MAX) -- Comma-separated list of CultureIDs
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Delete existing culture selections
        DELETE FROM [vendors].[VendorCultures]
        WHERE VendorProfileID = @VendorProfileID;
        
        -- Insert new culture selections
        IF @CultureIDs IS NOT NULL AND LEN(@CultureIDs) > 0
        BEGIN
            INSERT INTO [vendors].[VendorCultures] (VendorProfileID, CultureID, CreatedAt)
            SELECT @VendorProfileID, CAST(value AS INT), GETUTCDATE()
            FROM STRING_SPLIT(@CultureIDs, ',')
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

PRINT 'Stored procedure [vendors].[sp_Vendor_UpdateCultures] created successfully.';
GO
