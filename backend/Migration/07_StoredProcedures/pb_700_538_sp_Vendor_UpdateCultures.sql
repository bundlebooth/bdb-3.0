/*
    Migration Script: Create Stored Procedure [sp_Vendor_UpdateCultures]
    Phase: 700 - Stored Procedures
    Script: pb_700_538_sp_Vendor_UpdateCultures.sql
    Description: Updates vendor culture selections (replaces all)
    
    Execution Order: 538
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
        
        -- Insert new selections if provided
        IF @CultureIDs IS NOT NULL AND LEN(@CultureIDs) > 0
        BEGIN
            INSERT INTO [vendors].[VendorCultures] (VendorProfileID, CultureID)
            SELECT @VendorProfileID, CAST(value AS INT)
            FROM STRING_SPLIT(@CultureIDs, ',')
            WHERE LTRIM(RTRIM(value)) <> '';
        END
        
        COMMIT TRANSACTION;
        
        SELECT 1 AS Success;
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
