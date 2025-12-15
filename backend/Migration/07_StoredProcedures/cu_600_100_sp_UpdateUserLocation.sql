/*
    Migration Script: Create Stored Procedure [sp_UpdateUserLocation]
    Phase: 600 - Stored Procedures
    Script: cu_600_100_dbo.sp_UpdateUserLocation.sql
    Description: Creates the [dbo].[sp_UpdateUserLocation] stored procedure
    
    Execution Order: 100
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_UpdateUserLocation]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_UpdateUserLocation]'))
    DROP PROCEDURE [dbo].[sp_UpdateUserLocation];
GO

CREATE   PROCEDURE [dbo].[sp_UpdateUserLocation]
    @UserID INT,
    @Latitude DECIMAL(10, 8),
    @Longitude DECIMAL(11, 8),
    @City NVARCHAR(100) = NULL,
    @State NVARCHAR(50) = NULL,
    @Country NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO UserLocations (
        UserID,
        Latitude,
        Longitude,
        City,
        State,
        Country
    )
    VALUES (
        @UserID,
        @Latitude,
        @Longitude,
        @City,
        @State,
        @Country
    );
    
    SELECT SCOPE_IDENTITY() AS LocationID;
END;

GO

PRINT 'Stored procedure [dbo].[sp_UpdateUserLocation] created successfully.';
GO
