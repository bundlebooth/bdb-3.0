/*
    Migration Script: Create Stored Procedure [sp_GetRecentlyReviewedVendors]
    Phase: 600 - Stored Procedures
    Script: cu_600_043_dbo.sp_GetRecentlyReviewedVendors.sql
    Description: Creates the [dbo].[sp_GetRecentlyReviewedVendors] stored procedure
    
    Execution Order: 43
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetRecentlyReviewedVendors]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetRecentlyReviewedVendors]'))
    DROP PROCEDURE [dbo].[sp_GetRecentlyReviewedVendors];
GO

CREATE PROCEDURE [dbo].[sp_GetRecentlyReviewedVendors]
    @City NVARCHAR(100) = NULL,
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit) *
    FROM VendorProfiles
    WHERE ISNULL(IsVisible, 0) = 1
      AND (@City IS NULL OR City = @City)
      AND LastReviewDate IS NOT NULL
      AND LastReviewDate >= DATEADD(DAY, -14, GETDATE())
    ORDER BY LastReviewDate DESC;
END
GO

PRINT 'Stored procedure [dbo].[sp_GetRecentlyReviewedVendors] created successfully.';
GO
