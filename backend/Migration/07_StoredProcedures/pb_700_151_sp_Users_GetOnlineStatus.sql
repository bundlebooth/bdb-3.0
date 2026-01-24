-- =============================================
-- Stored Procedure: users.sp_GetOnlineStatus
-- Description: Gets online status for one or more users
-- Phase: 700 (Stored Procedures)
-- Schema: users
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetOnlineStatus]'))
    DROP PROCEDURE [users].[sp_GetOnlineStatus];
GO

CREATE PROCEDURE [users].[sp_GetOnlineStatus]
    @UserID INT = NULL,
    @UserIDs NVARCHAR(MAX) = NULL  -- Comma-separated list of user IDs
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Online threshold: 5 minutes
    DECLARE @OnlineThreshold DATETIME = DATEADD(MINUTE, -5, GETDATE());
    
    IF @UserID IS NOT NULL
    BEGIN
        -- Single user query
        SELECT 
            u.UserID,
            CONCAT(u.FirstName, ' ', ISNULL(u.LastName, '')) AS Name,
            u.LastActiveAt,
            CASE 
                WHEN u.LastActiveAt >= @OnlineThreshold THEN 1 
                ELSE 0 
            END AS IsOnline,
            CASE 
                WHEN u.LastActiveAt IS NULL THEN NULL
                ELSE DATEDIFF(MINUTE, u.LastActiveAt, GETDATE())
            END AS MinutesAgo
        FROM [users].[Users] u
        WHERE u.UserID = @UserID;
    END
    ELSE IF @UserIDs IS NOT NULL
    BEGIN
        -- Multiple users query using string split
        SELECT 
            u.UserID,
            CONCAT(u.FirstName, ' ', ISNULL(u.LastName, '')) AS Name,
            u.LastActiveAt,
            CASE 
                WHEN u.LastActiveAt >= @OnlineThreshold THEN 1 
                ELSE 0 
            END AS IsOnline,
            CASE 
                WHEN u.LastActiveAt IS NULL THEN NULL
                ELSE DATEDIFF(MINUTE, u.LastActiveAt, GETDATE())
            END AS MinutesAgo
        FROM [users].[Users] u
        WHERE u.UserID IN (
            SELECT TRY_CAST(LTRIM(RTRIM(value)) AS INT) 
            FROM STRING_SPLIT(@UserIDs, ',')
            WHERE TRY_CAST(LTRIM(RTRIM(value)) AS INT) IS NOT NULL
        );
    END
END;
GO
