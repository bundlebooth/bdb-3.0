/*
    Migration Script: Create Stored Procedure [sp_Vendor_UpdateEventTypes]
    Phase: 700 - Stored Procedures
    Script: pb_700_537_sp_Vendor_UpdateEventTypes.sql
    Description: Updates vendor event type selections (replaces all)
    
    Execution Order: 537
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_Vendor_UpdateEventTypes]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Vendor_UpdateEventTypes]'))
    DROP PROCEDURE [vendors].[sp_Vendor_UpdateEventTypes];
GO

CREATE PROCEDURE [vendors].[sp_Vendor_UpdateEventTypes]
    @VendorProfileID INT,
    @EventTypeIDs NVARCHAR(MAX) -- Comma-separated list of EventTypeIDs
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Delete existing event type selections
        DELETE FROM [vendors].[VendorEventTypes]
        WHERE VendorProfileID = @VendorProfileID;
        
        -- Insert new selections if provided
        IF @EventTypeIDs IS NOT NULL AND LEN(@EventTypeIDs) > 0
        BEGIN
            INSERT INTO [vendors].[VendorEventTypes] (VendorProfileID, EventTypeID)
            SELECT @VendorProfileID, CAST(value AS INT)
            FROM STRING_SPLIT(@EventTypeIDs, ',')
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

PRINT 'Stored procedure [vendors].[sp_Vendor_UpdateEventTypes] created successfully.';
GO
