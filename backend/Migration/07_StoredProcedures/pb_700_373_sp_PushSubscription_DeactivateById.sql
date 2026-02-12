/*
    Migration Script: Stored Procedure - Deactivate Push Subscription By ID
    Phase: 700 - Stored Procedures
    Script: pb_700_373_sp_PushSubscription_DeactivateById.sql
    Description: Deactivates a push subscription by SubscriptionID (for expired subscriptions).
    
    Created: 2026-02-12
*/

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[sp_PushSubscription_DeactivateById]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [users].[sp_PushSubscription_DeactivateById];
GO

CREATE PROCEDURE [users].[sp_PushSubscription_DeactivateById]
    @SubscriptionID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE [users].[PushSubscriptions] 
    SET IsActive = 0, UpdatedAt = GETDATE()
    WHERE SubscriptionID = @SubscriptionID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

PRINT 'Created stored procedure: [users].[sp_PushSubscription_DeactivateById]';
GO
