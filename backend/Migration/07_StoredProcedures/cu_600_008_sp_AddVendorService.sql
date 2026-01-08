/*
    Migration Script: Create Stored Procedure [sp_AddVendorService]
    Phase: 600 - Stored Procedures
    Script: cu_600_008_dbo.sp_AddVendorService.sql
    Description: Creates the [vendors].[sp_AddService] stored procedure
    
    Execution Order: 8
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_AddService]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_AddService]'))
    DROP PROCEDURE [vendors].[sp_AddService];
GO

CREATE   PROCEDURE [vendors].[sp_AddService]
    @VendorProfileID INT,
    @ServiceName NVARCHAR(255),
    @Description NVARCHAR(MAX),
    @Price DECIMAL(10,2),
    @Duration NVARCHAR(50),
    @Category NVARCHAR(100) = 'General Services'
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get or create service category
    DECLARE @CategoryID INT;
    SELECT @CategoryID = CategoryID 
    FROM vendors.ServiceCategories 
    WHERE VendorProfileID = @VendorProfileID AND Name = @Category;
    
    IF @CategoryID IS NULL
    BEGIN
        INSERT INTO ServiceCategories (VendorProfileID, Name, Description)
        VALUES (@VendorProfileID, @Category, @Category + ' offered by vendor');
        SET @CategoryID = SCOPE_IDENTITY();
    END
    
    -- Convert duration to minutes
    DECLARE @DurationMinutes INT = 60; -- Default 1 hour
    IF @Duration LIKE '%hour%'
        SET @DurationMinutes = CAST(SUBSTRING(@Duration, 1, CHARINDEX(' ', @Duration) - 1) AS INT) * 60;
    
    INSERT INTO Services (CategoryID, Name, Description, Price, DurationMinutes, ServiceType)
    VALUES (@CategoryID, @ServiceName, @Description, @Price, @DurationMinutes, 'Service');
    
    -- Update progress
    UPDATE vendors.VendorProfiles SET ServicesCompleted = 1, SetupStep = CASE WHEN SetupStep < 2 THEN 2 ELSE SetupStep END
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT SCOPE_IDENTITY() AS ServiceID, 'Service added successfully' AS Message;
END;

GO

PRINT 'Stored procedure [vendors].[sp_AddService] created successfully.';
GO

