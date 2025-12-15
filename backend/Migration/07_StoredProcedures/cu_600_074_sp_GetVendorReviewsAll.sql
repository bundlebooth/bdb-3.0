/*
    Migration Script: Create Stored Procedure [sp_GetVendorReviewsAll]
    Phase: 600 - Stored Procedures
    Script: cu_600_074_dbo.sp_GetVendorReviewsAll.sql
    Description: Creates the [dbo].[sp_GetVendorReviewsAll] stored procedure
    
    Execution Order: 74
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetVendorReviewsAll]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetVendorReviewsAll]'))
    DROP PROCEDURE [dbo].[sp_GetVendorReviewsAll];
GO

CREATE   PROCEDURE [dbo].[sp_GetVendorReviewsAll]
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

PRINT 'Stored procedure [dbo].[sp_GetVendorReviewsAll] created successfully.';
GO
