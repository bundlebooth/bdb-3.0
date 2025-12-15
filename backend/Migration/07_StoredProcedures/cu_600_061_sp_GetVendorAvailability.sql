/*
    Migration Script: Create Stored Procedure [sp_GetVendorAvailability]
    Phase: 600 - Stored Procedures
    Script: cu_600_061_dbo.sp_GetVendorAvailability.sql
    Description: Creates the [dbo].[sp_GetVendorAvailability] stored procedure
    
    Execution Order: 61
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetVendorAvailability]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetVendorAvailability]'))
    DROP PROCEDURE [dbo].[sp_GetVendorAvailability];
GO

CREATE   PROCEDURE [dbo].[sp_GetVendorAvailability]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Business Hours (including Timezone)
    SELECT 
        HoursID,
        DayOfWeek,
        OpenTime,
        CloseTime,
        IsAvailable,
        Timezone
    FROM VendorBusinessHours
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY DayOfWeek;
    
    -- Availability Exceptions
    SELECT 
        ExceptionID,
        Date,
        StartTime,
        EndTime,
        IsAvailable,
        Reason
    FROM VendorAvailabilityExceptions
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY Date;
END;

GO

PRINT 'Stored procedure [dbo].[sp_GetVendorAvailability] created successfully.';
GO
