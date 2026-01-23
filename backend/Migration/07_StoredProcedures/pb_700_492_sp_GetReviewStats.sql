/*
    Migration Script: Create Stored Procedure [admin].[sp_GetReviewStats]
    Description: Creates the [admin].[sp_GetReviewStats] stored procedure
*/

SET NOCOUNT ON;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetReviewStats]'))
    DROP PROCEDURE [admin].[sp_GetReviewStats];
GO


CREATE PROCEDURE admin.sp_GetReviewStats
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN IsFlagged = 1 THEN 1 ELSE 0 END) as flagged,
        AVG(CAST(Rating as FLOAT)) as avgRating
    FROM reviews.Reviews;
END
GO
