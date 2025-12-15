/*
    Migration Script: Create Stored Procedure [sp_GetTopRatedVendors]
    Phase: 600 - Stored Procedures
    Script: cu_600_050_dbo.sp_GetTopRatedVendors.sql
    Description: Creates the [dbo].[sp_GetTopRatedVendors] stored procedure
    
    Execution Order: 50
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetTopRatedVendors]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetTopRatedVendors]'))
    DROP PROCEDURE [dbo].[sp_GetTopRatedVendors];
GO

CREATE PROCEDURE [dbo].[sp_GetTopRatedVendors]
    @City NVARCHAR(100) = NULL,
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit) *
    FROM VendorProfiles
    WHERE ISNULL(IsVisible, 0) = 1
      AND (@City IS NULL OR City = @City)
      AND AvgRating >= 4.5
      AND TotalReviews >= 5
    ORDER BY AvgRating DESC, TotalReviews DESC;
END
GO

PRINT 'Stored procedure [dbo].[sp_GetTopRatedVendors] created successfully.';
GO
