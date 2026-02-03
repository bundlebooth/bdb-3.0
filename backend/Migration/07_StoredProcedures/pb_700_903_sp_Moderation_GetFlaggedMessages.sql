/*
    Migration Script: Create Stored Procedure [sp_Moderation_GetFlaggedMessages]
    Phase: 700 - Stored Procedures
    Script: pb_700_903_sp_Moderation_GetFlaggedMessages.sql
    Description: Gets flagged messages/violations for admin review with pagination
    Schema: admin
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [admin].[sp_GetFlaggedMessages]...';
GO

IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[sp_GetFlaggedMessages]') AND type in (N'P'))
BEGIN
    DROP PROCEDURE [admin].[sp_GetFlaggedMessages];
END
GO

CREATE PROCEDURE [admin].[sp_GetFlaggedMessages]
    @Page INT = 1,
    @Limit INT = 20,
    @IsReviewed BIT = NULL,
    @ViolationType VARCHAR(50) = NULL,
    @Severity INT = NULL,
    @UserID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@Page - 1) * @Limit;
    DECLARE @Total INT;
    
    -- Get total count
    SELECT @Total = COUNT(*)
    FROM [admin].[ChatViolations] cv
    WHERE (@IsReviewed IS NULL OR cv.IsReviewed = @IsReviewed)
    AND (@ViolationType IS NULL OR cv.ViolationType = @ViolationType)
    AND (@Severity IS NULL OR cv.Severity = @Severity)
    AND (@UserID IS NULL OR cv.UserID = @UserID);
    
    -- Get paginated results with user info
    SELECT 
        cv.ViolationID,
        cv.UserID,
        u.FirstName + ' ' + ISNULL(u.LastName, '') AS UserName,
        u.Email AS UserEmail,
        cv.MessageID,
        cv.ConversationID,
        cv.ViolationType,
        cv.DetectedContent,
        cv.OriginalMessage,
        cv.Severity,
        cv.IsBlocked,
        cv.IsReviewed,
        cv.ReviewedByAdminID,
        admin.FirstName + ' ' + ISNULL(admin.LastName, '') AS ReviewedByAdminName,
        cv.ReviewedAt,
        cv.ActionTaken,
        cv.AdminNotes,
        cv.CreatedAt,
        @Total AS TotalCount,
        -- Get user's total violation count
        (SELECT COUNT(*) FROM [admin].[ChatViolations] WHERE UserID = cv.UserID) AS UserTotalViolations,
        -- Check if user is currently locked
        u.IsLocked AS UserIsLocked
    FROM [admin].[ChatViolations] cv
    INNER JOIN [users].[Users] u ON cv.UserID = u.UserID
    LEFT JOIN [users].[Users] admin ON cv.ReviewedByAdminID = admin.UserID
    WHERE (@IsReviewed IS NULL OR cv.IsReviewed = @IsReviewed)
    AND (@ViolationType IS NULL OR cv.ViolationType = @ViolationType)
    AND (@Severity IS NULL OR cv.Severity = @Severity)
    AND (@UserID IS NULL OR cv.UserID = @UserID)
    ORDER BY cv.CreatedAt DESC
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;
END
GO

PRINT 'Stored procedure [admin].[sp_GetFlaggedMessages] created successfully.';
GO
