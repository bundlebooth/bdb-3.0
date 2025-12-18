/*
    Migration Script: Create Stored Procedure [vendors.sp_GetRecentlyReviewed]
    Phase: 600 - Stored Procedures
    Script: cu_600_043_sp_GetRecentlyReviewedVendors.sql
    Description: Creates the [vendors].[sp_GetRecentlyReviewed] stored procedure
    Schema: vendors
    Execution Order: 43
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetRecentlyReviewed]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetRecentlyReviewed]'))
    DROP PROCEDURE [vendors].[sp_GetRecentlyReviewed];
GO

CREATE PROCEDURE [vendors].[sp_GetRecentlyReviewed]
    @City NVARCHAR(100) = NULL,
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit) *
    FROM vendors.VendorProfiles
    WHERE ISNULL(IsVisible, 0) = 1
      AND (@City IS NULL OR City = @City)
      AND LastReviewDate IS NOT NULL
      AND LastReviewDate >= DATEADD(DAY, -14, GETDATE())
    ORDER BY LastReviewDate DESC;
END
GO

PRINT 'Stored procedure [vendors].[sp_GetRecentlyReviewed] created successfully.';
GO

