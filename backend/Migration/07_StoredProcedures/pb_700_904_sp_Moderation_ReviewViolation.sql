/*
    Migration Script: Create Stored Procedure [sp_Moderation_ReviewViolation]
    Phase: 700 - Stored Procedures
    Script: pb_700_904_sp_Moderation_ReviewViolation.sql
    Description: Marks a violation as reviewed and records the action taken
    Schema: admin
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [admin].[sp_ReviewViolation]...';
GO

IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[sp_ReviewViolation]') AND type in (N'P'))
BEGIN
    DROP PROCEDURE [admin].[sp_ReviewViolation];
END
GO

CREATE PROCEDURE [admin].[sp_ReviewViolation]
    @ViolationID INT,
    @AdminID INT,
    @ActionTaken VARCHAR(50), -- 'dismissed', 'warned', 'locked', 'escalated'
    @AdminNotes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE [admin].[ChatViolations]
    SET 
        IsReviewed = 1,
        ReviewedByAdminID = @AdminID,
        ReviewedAt = GETDATE(),
        ActionTaken = @ActionTaken,
        AdminNotes = @AdminNotes
    WHERE ViolationID = @ViolationID;
    
    -- Return updated violation
    SELECT 
        cv.ViolationID,
        cv.UserID,
        cv.IsReviewed,
        cv.ActionTaken,
        cv.AdminNotes,
        cv.ReviewedAt
    FROM [admin].[ChatViolations] cv
    WHERE cv.ViolationID = @ViolationID;
END
GO

PRINT 'Stored procedure [admin].[sp_ReviewViolation] created successfully.';
GO
