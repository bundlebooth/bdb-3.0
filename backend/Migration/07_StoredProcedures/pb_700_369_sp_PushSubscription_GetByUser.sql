/*
    Migration Script: Stored Procedure - Get Push Subscriptions By User
    Phase: 700 - Stored Procedures
    Script: pb_700_369_sp_PushSubscription_GetByUser.sql
    Description: Gets all push subscriptions for a user.
    
    Created: 2026-02-12
*/

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[sp_PushSubscription_GetByUser]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [users].[sp_PushSubscription_GetByUser];
GO

CREATE PROCEDURE [users].[sp_PushSubscription_GetByUser]
    @UserID INT,
    @ActiveOnly BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        IF @ActiveOnly = 1
        BEGIN
            SELECT 
                SubscriptionID, 
                Endpoint, 
                P256dhKey,
                AuthKey,
                DeviceName, 
                IsActive, 
                CreatedAt, 
                UpdatedAt
            FROM [users].[PushSubscriptions]
            WHERE UserID = @UserID AND IsActive = 1
            ORDER BY CreatedAt DESC;
        END
        ELSE
        BEGIN
            SELECT 
                SubscriptionID, 
                Endpoint, 
                P256dhKey,
                AuthKey,
                DeviceName, 
                IsActive, 
                CreatedAt, 
                UpdatedAt
            FROM [users].[PushSubscriptions]
            WHERE UserID = @UserID
            ORDER BY CreatedAt DESC;
        END
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

PRINT 'Created stored procedure: [users].[sp_PushSubscription_GetByUser]';
GO
