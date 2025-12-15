/*
    Migration Script: Create Stored Procedure [sp_AddVendorAvailability]
    Phase: 600 - Stored Procedures
    Script: cu_600_005_dbo.sp_AddVendorAvailability.sql
    Description: Creates the [dbo].[sp_AddVendorAvailability] stored procedure
    
    Execution Order: 5
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_AddVendorAvailability]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_AddVendorAvailability]'))
    DROP PROCEDURE [dbo].[sp_AddVendorAvailability];
GO

CREATE   PROCEDURE [dbo].[sp_AddVendorAvailability]
    @VendorProfileID INT,
    @DayOfWeek TINYINT,
    @StartTime TIME,
    @EndTime TIME
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Use MERGE for upsert functionality
    MERGE VendorBusinessHours AS target
    USING (SELECT @VendorProfileID AS VendorProfileID, @DayOfWeek AS DayOfWeek, @StartTime AS OpenTime, @EndTime AS CloseTime) AS source
    ON target.VendorProfileID = source.VendorProfileID AND target.DayOfWeek = source.DayOfWeek
    WHEN MATCHED THEN
        UPDATE SET OpenTime = source.OpenTime, CloseTime = source.CloseTime, IsAvailable = 1
    WHEN NOT MATCHED THEN
        INSERT (VendorProfileID, DayOfWeek, OpenTime, CloseTime, IsAvailable)
        VALUES (source.VendorProfileID, source.DayOfWeek, source.OpenTime, source.CloseTime, 1);
    
    -- Update progress
    UPDATE VendorProfiles SET AvailabilityCompleted = 1, SetupStep = 4
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT 1 AS Success, 'Availability added successfully' AS Message;
END;

GO

PRINT 'Stored procedure [dbo].[sp_AddVendorAvailability] created successfully.';
GO
