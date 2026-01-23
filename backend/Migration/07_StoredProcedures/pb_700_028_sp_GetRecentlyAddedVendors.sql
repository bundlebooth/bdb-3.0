/*
    Migration Script: Create Stored Procedure [vendors.sp_GetRecentlyAdded]
    Phase: 600 - Stored Procedures
    Script: cu_600_042_sp_GetRecentlyAddedVendors.sql
    Description: Creates the [vendors].[sp_GetRecentlyAdded] stored procedure
    Schema: vendors
    Execution Order: 42
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetRecentlyAdded]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetRecentlyAdded]'))
    DROP PROCEDURE [vendors].[sp_GetRecentlyAdded];
GO

CREATE PROCEDURE [vendors].[sp_GetRecentlyAdded]
    @City NVARCHAR(100) = NULL,
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit) *
    FROM vendors.VendorProfiles
    WHERE ISNULL(IsVisible, 0) = 1
      AND (@City IS NULL OR City = @City)
      AND CreatedAt >= DATEADD(DAY, -30, GETDATE())
    ORDER BY CreatedAt DESC;
END
GO

PRINT 'Stored procedure [vendors].[sp_GetRecentlyAdded] created successfully.';
GO

