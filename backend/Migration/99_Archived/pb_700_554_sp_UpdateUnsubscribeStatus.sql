-- =============================================
-- Stored Procedure: users.sp_UpdateUnsubscribeStatus
-- Description: Update user email unsubscribe status
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[sp_UpdateUnsubscribeStatus]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [users].[sp_UpdateUnsubscribeStatus]
GO

CREATE PROCEDURE [users].[sp_UpdateUnsubscribeStatus]
    @UserID INT,
    @UnsubscribedFromAll BIT
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @UnsubscribedFromAll = 1
    BEGIN
        UPDATE users.Users 
        SET UnsubscribedFromAll = @UnsubscribedFromAll, 
            UnsubscribedAt = GETUTCDATE() 
        WHERE UserID = @UserID
    END
    ELSE
    BEGIN
        UPDATE users.Users 
        SET UnsubscribedFromAll = @UnsubscribedFromAll, 
            UnsubscribedAt = NULL 
        WHERE UserID = @UserID
    END
END
GO
