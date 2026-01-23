/*
    Migration Script: Create Stored Procedure [sp_UpdateUserLocation]
    Phase: 600 - Stored Procedures
    Script: cu_600_100_dbo.sp_UpdateUserLocation.sql
    Description: Creates the [users].[sp_UpdateLocation] stored procedure
    
    Execution Order: 100
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [users].[sp_UpdateLocation]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_UpdateLocation]'))
    DROP PROCEDURE [users].[sp_UpdateLocation];
GO

CREATE   PROCEDURE [users].[sp_UpdateLocation]
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

PRINT 'Stored procedure [users].[sp_UpdateLocation] created successfully.';
GO
