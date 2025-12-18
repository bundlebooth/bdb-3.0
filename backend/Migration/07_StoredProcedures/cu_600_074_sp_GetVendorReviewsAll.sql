/*
    Migration Script: Create Stored Procedure [sp_GetVendorReviewsAll]
    Phase: 600 - Stored Procedures
    Script: cu_600_074_dbo.sp_GetVendorReviewsAll.sql
    Description: Creates the [vendors].[sp_GetReviewsAll] stored procedure
    
    Execution Order: 74
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetReviewsAll]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetReviewsAll]'))
    DROP PROCEDURE [vendors].[sp_GetReviewsAll];
GO

CREATE   PROCEDURE [vendors].[sp_GetReviewsAll]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT *
    FROM vw_VendorReviews
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY CreatedAt DESC;
END;

GO

PRINT 'Stored procedure [vendors].[sp_GetReviewsAll] created successfully.';
GO
