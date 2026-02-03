/*
    Migration Script: Create Stored Procedure [sp_Moderation_LogViolation]
    Phase: 700 - Stored Procedures
    Script: pb_700_900_sp_Moderation_LogViolation.sql
    Description: Logs a chat content violation and returns violation count for user
    Schema: admin
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [admin].[sp_LogViolation]...';
GO

IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[sp_LogViolation]') AND type in (N'P'))
BEGIN
    DROP PROCEDURE [admin].[sp_LogViolation];
END
GO

CREATE PROCEDURE [admin].[sp_LogViolation]
    @UserID INT,
    @MessageID INT = NULL,
    @ConversationID INT = NULL,
    @ViolationType VARCHAR(50),
    @DetectedContent NVARCHAR(500) = NULL,
    @OriginalMessage NVARCHAR(MAX) = NULL,
    @Severity INT = 1,
    @IsBlocked BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ViolationID INT;
    DECLARE @ViolationCount INT;
    DECLARE @RecentViolationCount INT;
    
    -- Insert the violation record
    INSERT INTO [admin].[ChatViolations] (
        UserID, MessageID, ConversationID, ViolationType, 
        DetectedContent, OriginalMessage, Severity, IsBlocked
    )
    VALUES (
        @UserID, @MessageID, @ConversationID, @ViolationType,
        @DetectedContent, @OriginalMessage, @Severity, @IsBlocked
    );
    
    SET @ViolationID = SCOPE_IDENTITY();
    
    -- Get total violation count for user
    SELECT @ViolationCount = COUNT(*)
    FROM [admin].[ChatViolations]
    WHERE UserID = @UserID;
    
    -- Get recent violation count (last 24 hours) for determining if lock is needed
    SELECT @RecentViolationCount = COUNT(*)
    FROM [admin].[ChatViolations]
    WHERE UserID = @UserID
    AND CreatedAt >= DATEADD(HOUR, -24, GETDATE());
    
    -- Return the violation info
    SELECT 
        @ViolationID AS ViolationID,
        @ViolationCount AS TotalViolationCount,
        @RecentViolationCount AS RecentViolationCount,
        @Severity AS Severity;
END
GO

PRINT 'Stored procedure [admin].[sp_LogViolation] created successfully.';
GO
