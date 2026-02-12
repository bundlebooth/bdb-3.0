/*
    Migration Script: Stored Procedure - Get Active Push Subscriptions By User
    Phase: 700 - Stored Procedures
    Script: pb_700_372_sp_PushSubscription_GetActiveByUser.sql
    Description: Gets active push subscriptions for sending push notifications.
    
    Created: 2026-02-12
*/

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[sp_PushSubscription_GetActiveByUser]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [users].[sp_PushSubscription_GetActiveByUser];
GO

CREATE PROCEDURE [users].[sp_PushSubscription_GetActiveByUser]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT SubscriptionID, Endpoint, P256dhKey, AuthKey 
    FROM [users].[PushSubscriptions] 
    WHERE UserID = @UserID AND IsActive = 1;
END
GO

PRINT 'Created stored procedure: [users].[sp_PushSubscription_GetActiveByUser]';
GO
