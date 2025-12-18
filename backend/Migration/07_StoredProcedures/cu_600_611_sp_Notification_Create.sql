-- =============================================
-- Stored Procedure: sp_Notification_Create
-- Description: Creates a notification
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Notification_Create]'))
    DROP PROCEDURE [dbo].[sp_Notification_Create];
GO

CREATE PROCEDURE [dbo].[sp_Notification_Create]
    @UserID INT,
    @Type NVARCHAR(50),
    @Title NVARCHAR(255),
    @Message NVARCHAR(MAX),
    @RelatedID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO Notifications (UserID, Type, Title, Message, RelatedID, IsRead, CreatedAt)
    OUTPUT INSERTED.*
    VALUES (@UserID, @Type, @Title, @Message, @RelatedID, 0, GETDATE());
END
GO
