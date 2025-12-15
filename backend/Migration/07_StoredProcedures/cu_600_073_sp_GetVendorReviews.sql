/*
    Migration Script: Create Stored Procedure [sp_GetVendorReviews]
    Phase: 600 - Stored Procedures
    Script: cu_600_073_dbo.sp_GetVendorReviews.sql
    Description: Creates the [dbo].[sp_GetVendorReviews] stored procedure
    
    Execution Order: 73
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetVendorReviews]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetVendorReviews]'))
    DROP PROCEDURE [dbo].[sp_GetVendorReviews];
GO

CREATE   PROCEDURE [dbo].[sp_GetVendorReviews]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        r.ReviewID,
        u.Name AS ReviewerName,
        r.Rating,
        r.Comment,
        r.CreatedAt
    FROM Reviews r
    LEFT JOIN Users u ON r.UserID = u.UserID
    WHERE r.VendorProfileID = @VendorProfileID
    ORDER BY r.CreatedAt DESC;
END

GO

PRINT 'Stored procedure [dbo].[sp_GetVendorReviews] created successfully.';
GO
