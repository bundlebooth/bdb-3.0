/*
    Migration Script: Create Stored Procedure [sp_DeleteVendorService]
    Phase: 600 - Stored Procedures
    Script: cu_600_026_dbo.sp_DeleteVendorService.sql
    Description: Creates the [vendors].[sp_DeleteService] stored procedure
    
    Execution Order: 26
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_DeleteService]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_DeleteService]'))
    DROP PROCEDURE [vendors].[sp_DeleteService];
GO

CREATE   PROCEDURE [vendors].[sp_DeleteService]
    @ServiceID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Ensure the service belongs to the vendor
    IF EXISTS (
        SELECT 1 
        FROM vendors.Services s
        JOIN vendors.ServiceCategories sc ON s.CategoryID = sc.CategoryID
        WHERE s.ServiceID = @ServiceID AND sc.VendorProfileID = @VendorProfileID
    )
    BEGIN
        -- Optionally, check for active bookings before deleting
        IF EXISTS (SELECT 1 FROM bookings.Bookings WHERE ServiceID = @ServiceID AND Status NOT IN ('cancelled', 'completed'))
        BEGIN
            RAISERROR('Cannot delete service with active bookings. Please cancel or complete bookings first.', 16, 1);
            RETURN;
        END

        DELETE FROM vendors.Services WHERE ServiceID = @ServiceID;
        SELECT 1 AS Success;
    END
    ELSE
    BEGIN
        RAISERROR('Service not found or does not belong to this vendor.', 16, 1);
        SELECT 0 AS Success;
    END
END;

GO

PRINT 'Stored procedure [vendors].[sp_DeleteService] created successfully.';
GO

