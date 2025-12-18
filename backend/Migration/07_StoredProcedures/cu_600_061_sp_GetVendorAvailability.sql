/*
    Migration Script: Create Stored Procedure [sp_GetVendorAvailability]
    Phase: 600 - Stored Procedures
    Script: cu_600_061_dbo.sp_GetVendorAvailability.sql
    Description: Creates the [vendors].[sp_GetAvailability] stored procedure
    
    Execution Order: 61
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetAvailability]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetAvailability]'))
    DROP PROCEDURE [vendors].[sp_GetAvailability];
GO

CREATE   PROCEDURE [vendors].[sp_GetAvailability]
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
    FROM vendors.VendorBusinessHours
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
    FROM vendors.VendorAvailabilityExceptions
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY Date;
END;

GO

PRINT 'Stored procedure [vendors].[sp_GetAvailability] created successfully.';
GO


