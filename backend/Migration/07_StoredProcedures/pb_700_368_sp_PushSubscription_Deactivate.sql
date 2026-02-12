/*
    Migration Script: Stored Procedure - Deactivate Push Subscription
    Phase: 700 - Stored Procedures
    Script: pb_700_368_sp_PushSubscription_Deactivate.sql
    Description: Deactivates a push subscription for a user by endpoint.
    
    Created: 2026-02-12
*/

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[sp_PushSubscription_Deactivate]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [users].[sp_PushSubscription_Deactivate];
GO

CREATE PROCEDURE [users].[sp_PushSubscription_Deactivate]
    @UserID INT,
    @Endpoint NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        UPDATE [users].[PushSubscriptions]
        SET IsActive = 0, UpdatedAt = GETDATE()
        WHERE UserID = @UserID AND Endpoint = @Endpoint;
        
        SELECT @@ROWCOUNT AS RowsAffected;
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

PRINT 'Created stored procedure: [users].[sp_PushSubscription_Deactivate]';
GO
