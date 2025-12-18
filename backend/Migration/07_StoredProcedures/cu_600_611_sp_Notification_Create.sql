-- =============================================
-- Stored Procedure: notifications.sp_Create
-- Description: Creates a notification
-- Phase: 600 (Stored Procedures)
-- Schema: notifications
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[notifications].[sp_Create]'))
    DROP PROCEDURE [notifications].[sp_Create];
GO

CREATE PROCEDURE [notifications].[sp_Create]
    @UserID INT,
    @Type NVARCHAR(50),
    @Title NVARCHAR(255),
    @Message NVARCHAR(MAX),
    @RelatedID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO notifications.Notifications (UserID, Type, Title, Message, RelatedID, IsRead, CreatedAt)
    OUTPUT INSERTED.*
    VALUES (@UserID, @Type, @Title, @Message, @RelatedID, 0, GETDATE());
END
GO

