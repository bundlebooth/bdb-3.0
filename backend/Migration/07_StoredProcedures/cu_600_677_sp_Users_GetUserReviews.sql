/*
    Migration Script: Create Stored Procedure [users].[sp_GetUserReviews]
    Phase: 600 - Stored Procedures
    Script: cu_600_677_sp_Users_GetUserReviews.sql
    Description: Creates the [users].[sp_GetUserReviews] stored procedure
                 Used by GET /api/users/:id/reviews endpoint
    
    Execution Order: 677
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [users].[sp_GetUserReviews]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetUserReviews]'))
    DROP PROCEDURE [users].[sp_GetUserReviews];
GO

CREATE PROCEDURE [users].[sp_GetUserReviews]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        r.ReviewID,
        r.BookingID,
        r.VendorProfileID,
        r.UserID,
        r.Rating,
        r.Title,
        r.Comment,
        r.Comment AS ReviewText,
        r.Response,
        r.ResponseDate,
        r.IsAnonymous,
        r.IsFeatured,
        r.IsApproved AS IsVerified,
        r.QualityRating,
        r.CommunicationRating,
        r.ValueRating,
        r.PunctualityRating,
        r.ProfessionalismRating,
        r.WouldRecommend,
        r.CreatedAt,
        r.UpdatedAt,
        vp.BusinessName AS VendorName,
        vp.LogoURL AS VendorLogo
    FROM vendors.Reviews r
    INNER JOIN vendors.VendorProfiles vp ON r.VendorProfileID = vp.VendorProfileID
    WHERE r.UserID = @UserID
    ORDER BY r.CreatedAt DESC;
END;

GO

PRINT 'Stored procedure [users].[sp_GetUserReviews] created successfully.';
GO
