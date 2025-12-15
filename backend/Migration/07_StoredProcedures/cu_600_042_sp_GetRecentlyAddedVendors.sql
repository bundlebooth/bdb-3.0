/*
    Migration Script: Create Stored Procedure [sp_GetRecentlyAddedVendors]
    Phase: 600 - Stored Procedures
    Script: cu_600_042_dbo.sp_GetRecentlyAddedVendors.sql
    Description: Creates the [dbo].[sp_GetRecentlyAddedVendors] stored procedure
    
    Execution Order: 42
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetRecentlyAddedVendors]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetRecentlyAddedVendors]'))
    DROP PROCEDURE [dbo].[sp_GetRecentlyAddedVendors];
GO

CREATE PROCEDURE [dbo].[sp_GetRecentlyAddedVendors]
    @City NVARCHAR(100) = NULL,
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit) *
    FROM VendorProfiles
    WHERE ISNULL(IsVisible, 0) = 1
      AND (@City IS NULL OR City = @City)
      AND CreatedAt >= DATEADD(DAY, -30, GETDATE())
    ORDER BY CreatedAt DESC;
END
GO

PRINT 'Stored procedure [dbo].[sp_GetRecentlyAddedVendors] created successfully.';
GO
