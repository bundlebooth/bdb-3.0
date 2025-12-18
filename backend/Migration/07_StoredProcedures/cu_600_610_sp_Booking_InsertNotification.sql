-- =============================================
-- Stored Procedure: bookings.sp_InsertNotification
-- Description: Inserts a notification
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_InsertNotification]'))
    DROP PROCEDURE [bookings].[sp_InsertNotification];
GO

CREATE PROCEDURE [bookings].[sp_InsertNotification]
    @UserID INT,
    @Type NVARCHAR(50),
    @Title NVARCHAR(255),
    @Message NVARCHAR(MAX),
    @RelatedID INT,
    @RelatedType NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO notifications.Notifications (UserID, Type, Title, Message, RelatedID, RelatedType, CreatedAt)
    VALUES (@UserID, @Type, @Title, @Message, @RelatedID, @RelatedType, GETDATE());
    
    SELECT SCOPE_IDENTITY() AS NotificationID;
END
GO

