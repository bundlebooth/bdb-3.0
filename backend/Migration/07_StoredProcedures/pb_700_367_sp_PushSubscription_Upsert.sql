/*
    Migration Script: Stored Procedure - Upsert Push Subscription
    Phase: 700 - Stored Procedures
    Script: pb_700_367_sp_PushSubscription_Upsert.sql
    Description: Creates or updates a push subscription for a user.
                 Used when a user subscribes to push notifications.
    
    Created: 2026-02-12
*/

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[sp_PushSubscription_Upsert]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [users].[sp_PushSubscription_Upsert];
GO

CREATE PROCEDURE [users].[sp_PushSubscription_Upsert]
    @UserID INT,
    @Endpoint NVARCHAR(500),
    @P256dhKey NVARCHAR(500),
    @AuthKey NVARCHAR(500),
    @Subscription NVARCHAR(MAX),
    @DeviceName NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Check if subscription already exists for this user and endpoint
        IF EXISTS (
            SELECT 1 FROM [users].[PushSubscriptions] 
            WHERE UserID = @UserID AND Endpoint = @Endpoint
        )
        BEGIN
            -- Update existing subscription
            UPDATE [users].[PushSubscriptions]
            SET 
                P256dhKey = @P256dhKey,
                AuthKey = @AuthKey,
                Subscription = @Subscription,
                DeviceName = @DeviceName,
                IsActive = 1,
                UpdatedAt = GETDATE()
            WHERE UserID = @UserID AND Endpoint = @Endpoint;
            
            SELECT SubscriptionID, 'updated' AS Action
            FROM [users].[PushSubscriptions]
            WHERE UserID = @UserID AND Endpoint = @Endpoint;
        END
        ELSE
        BEGIN
            -- Insert new subscription
            INSERT INTO [users].[PushSubscriptions] 
            (
                UserID, 
                Endpoint, 
                P256dhKey,
                AuthKey,
                Subscription,
                DeviceName,
                IsActive,
                CreatedAt,
                UpdatedAt
            )
            VALUES 
            (
                @UserID, 
                @Endpoint, 
                @P256dhKey,
                @AuthKey,
                @Subscription,
                @DeviceName,
                1,
                GETDATE(),
                GETDATE()
            );
            
            SELECT SCOPE_IDENTITY() AS SubscriptionID, 'created' AS Action;
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

PRINT 'Created stored procedure: [users].[sp_PushSubscription_Upsert]';
GO
