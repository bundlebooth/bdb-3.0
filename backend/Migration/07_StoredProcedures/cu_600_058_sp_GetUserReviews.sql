/*
    Migration Script: Create Stored Procedure [sp_GetUserReviews]
    Phase: 600 - Stored Procedures
    Script: cu_600_058_dbo.sp_GetUserReviews.sql
    Description: Creates the [dbo].[sp_GetUserReviews] stored procedure
    
    Execution Order: 58
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetUserReviews]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetUserReviews]'))
    DROP PROCEDURE [dbo].[sp_GetUserReviews];
GO

CREATE   PROCEDURE [dbo].[sp_GetUserReviews]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        r.ReviewID,
        r.VendorProfileID,
        vp.BusinessName AS VendorName,
        r.BookingID,
        r.Rating,
        r.Title,
        r.Comment,
        r.CreatedAt,
        (SELECT TOP 1 vi.ImageURL FROM VendorImages vi WHERE vi.VendorProfileID = vp.VendorProfileID AND vi.IsPrimary = 1) AS VendorImage
    FROM Reviews r
    JOIN VendorProfiles vp ON r.VendorProfileID = vp.VendorProfileID
    WHERE r.UserID = @UserID
    ORDER BY r.CreatedAt DESC;
END;

GO

PRINT 'Stored procedure [dbo].[sp_GetUserReviews] created successfully.';
GO
