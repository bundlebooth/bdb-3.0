/*
    Migration Script: Create Stored Procedure [sp_GetVendorReviews]
    Phase: 600 - Stored Procedures
    Script: cu_600_073_dbo.sp_GetVendorReviews.sql
    Description: Creates the [vendors].[sp_GetReviews] stored procedure
    
    Execution Order: 73
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetReviews]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetReviews]'))
    DROP PROCEDURE [vendors].[sp_GetReviews];
GO

CREATE   PROCEDURE [vendors].[sp_GetReviews]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        r.ReviewID,
        r.UserID,
        CONCAT(u.FirstName, ' ', ISNULL(u.LastName, '')) AS ReviewerName,
        u.ProfileImageURL AS ReviewerAvatar,
        r.Rating,
        r.Title,
        r.Comment,
        r.Response,
        r.ResponseDate,
        r.QualityRating,
        r.CommunicationRating,
        r.ValueRating,
        r.PunctualityRating,
        r.ProfessionalismRating,
        r.WouldRecommend,
        r.IsAnonymous,
        r.CreatedAt
    FROM vendors.Reviews r
    LEFT JOIN users.Users u ON r.UserID = u.UserID
    WHERE r.VendorProfileID = @VendorProfileID
      AND r.IsApproved = 1
    ORDER BY r.CreatedAt DESC;
END

GO

PRINT 'Stored procedure [vendors].[sp_GetReviews] created successfully.';
GO


