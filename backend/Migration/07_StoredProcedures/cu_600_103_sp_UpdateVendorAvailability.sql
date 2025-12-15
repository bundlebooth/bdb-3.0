/*
    Migration Script: Create Stored Procedure [sp_UpdateVendorAvailability]
    Phase: 600 - Stored Procedures
    Script: cu_600_103_dbo.sp_UpdateVendorAvailability.sql
    Description: Creates the [dbo].[sp_UpdateVendorAvailability] stored procedure
    
    Execution Order: 103
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_UpdateVendorAvailability]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_UpdateVendorAvailability]'))
    DROP PROCEDURE [dbo].[sp_UpdateVendorAvailability];
GO

CREATE   PROCEDURE [dbo].[sp_UpdateVendorAvailability]
    @VendorProfileID INT,
    @BusinessHours NVARCHAR(MAX), -- JSON array of business hours
    @AcceptingBookings BIT = 1,
    @ResponseTimeHours INT = 24,
    @BufferTimeMinutes INT = 30
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Update vendor profile with availability settings
        UPDATE VendorProfiles 
        SET AcceptingBookings = @AcceptingBookings,
            ResponseTimeHours = @ResponseTimeHours,
            BufferTimeMinutes = @BufferTimeMinutes,
            SetupStep7Completed = 1,
            UpdatedAt = GETDATE()
        WHERE VendorProfileID = @VendorProfileID;
        
        -- Clear existing business hours
        DELETE FROM VendorBusinessHours WHERE VendorProfileID = @VendorProfileID;
        
        -- Insert new business hours from JSON
        IF @BusinessHours IS NOT NULL
        BEGIN
            INSERT INTO VendorBusinessHours (VendorProfileID, DayOfWeek, OpenTime, CloseTime, IsAvailable)
            SELECT 
                @VendorProfileID,
                JSON_VALUE(value, '$.dayOfWeek'),
                JSON_VALUE(value, '$.openTime'),
                JSON_VALUE(value, '$.closeTime'),
                JSON_VALUE(value, '$.isAvailable')
            FROM OPENJSON(@BusinessHours);
        END;
        
        COMMIT TRANSACTION;
        SELECT 1 AS Success, 'Availability updated successfully' AS Message;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT 0 AS Success, ERROR_MESSAGE() AS Message;
    END CATCH
END;

GO

PRINT 'Stored procedure [dbo].[sp_UpdateVendorAvailability] created successfully.';
GO
