/*
    Migration Script: Create Stored Procedure [vendors.sp_GetTopRated]
    Phase: 600 - Stored Procedures
    Script: cu_600_050_sp_GetTopRatedVendors.sql
    Description: Creates the [vendors].[sp_GetTopRated] stored procedure
    Schema: vendors
    Execution Order: 50
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetTopRated]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetTopRated]'))
    DROP PROCEDURE [vendors].[sp_GetTopRated];
GO

CREATE PROCEDURE [vendors].[sp_GetTopRated]
    @City NVARCHAR(100) = NULL,
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit) *
    FROM vendors.VendorProfiles
    WHERE ISNULL(IsVisible, 0) = 1
      AND (@City IS NULL OR City = @City)
      AND AvgRating >= 4.5
      AND TotalReviews >= 5
    ORDER BY AvgRating DESC, TotalReviews DESC;
END
GO

PRINT 'Stored procedure [vendors].[sp_GetTopRated] created successfully.';
GO

