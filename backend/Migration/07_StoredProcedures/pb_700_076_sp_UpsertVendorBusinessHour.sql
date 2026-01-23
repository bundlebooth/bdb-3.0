/*
    Migration Script: Create Stored Procedure [sp_UpsertVendorBusinessHour]
    Phase: 600 - Stored Procedures
    Script: cu_600_117_dbo.sp_UpsertVendorBusinessHour.sql
    Description: Creates the [vendors].[sp_UpsertBusinessHour] stored procedure
    
    Execution Order: 117
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_UpsertBusinessHour]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpsertBusinessHour]'))
    DROP PROCEDURE [vendors].[sp_UpsertBusinessHour];
GO

CREATE   PROCEDURE [vendors].[sp_UpsertBusinessHour]
    @HoursID INT = NULL, -- NULL for new, ID for update
    @VendorProfileID INT,
    @DayOfWeek TINYINT,
    @OpenTime TIME = NULL,
    @CloseTime TIME = NULL,
    @IsAvailable BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF @HoursID IS NULL -- Insert new
    BEGIN
        INSERT INTO vendors.VendorBusinessHours (VendorProfileID, DayOfWeek, OpenTime, CloseTime, IsAvailable)
        VALUES (@VendorProfileID, @DayOfWeek, @OpenTime, @CloseTime, @IsAvailable);
        SELECT SCOPE_IDENTITY() AS HoursID;
    END
    ELSE -- Update existing
    BEGIN
        UPDATE vendors.VendorBusinessHours
        SET
            OpenTime = @OpenTime,
            CloseTime = @CloseTime,
            IsAvailable = @IsAvailable
        WHERE HoursID = @HoursID AND VendorProfileID = @VendorProfileID;
        SELECT @HoursID AS HoursID;
    END
END;

GO

PRINT 'Stored procedure [vendors].[sp_UpsertBusinessHour] created successfully.';
GO

