-- =============================================
-- Stored Procedure: sp_Booking_InsertNotification
-- Description: Inserts a notification
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Booking_InsertNotification]'))
    DROP PROCEDURE [dbo].[sp_Booking_InsertNotification];
GO

CREATE PROCEDURE [dbo].[sp_Booking_InsertNotification]
    @UserID INT,
    @Type NVARCHAR(50),
    @Title NVARCHAR(255),
    @Message NVARCHAR(MAX),
    @RelatedID INT,
    @RelatedType NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO Notifications (UserID, Type, Title, Message, RelatedID, RelatedType, CreatedAt)
    VALUES (@UserID, @Type, @Title, @Message, @RelatedID, @RelatedType, GETDATE());
    
    SELECT SCOPE_IDENTITY() AS NotificationID;
END
GO
