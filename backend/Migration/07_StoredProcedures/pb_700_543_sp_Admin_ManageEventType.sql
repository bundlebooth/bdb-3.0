/*
    Migration Script: Create Stored Procedure [sp_Admin_ManageEventType]
    Phase: 700 - Stored Procedures
    Script: pb_700_543_sp_Admin_ManageEventType.sql
    Description: Admin procedure to add, edit, or delete event types
    
    Execution Order: 543
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [admin].[sp_Admin_ManageEventType]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_Admin_ManageEventType]'))
    DROP PROCEDURE [admin].[sp_Admin_ManageEventType];
GO

CREATE PROCEDURE [admin].[sp_Admin_ManageEventType]
    @Action NVARCHAR(10), -- 'add', 'edit', 'delete'
    @EventTypeID INT = NULL,
    @EventTypeKey NVARCHAR(50) = NULL,
    @EventTypeName NVARCHAR(100) = NULL,
    @DisplayOrder INT = 0,
    @IsActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @Action = 'add'
    BEGIN
        INSERT INTO [admin].[EventTypes] (EventTypeKey, EventTypeName, DisplayOrder, IsActive)
        VALUES (@EventTypeKey, @EventTypeName, @DisplayOrder, @IsActive);
        
        SELECT SCOPE_IDENTITY() AS EventTypeID, 'Event type added successfully' AS Message;
    END
    ELSE IF @Action = 'edit'
    BEGIN
        UPDATE [admin].[EventTypes]
        SET 
            EventTypeKey = COALESCE(@EventTypeKey, EventTypeKey),
            EventTypeName = COALESCE(@EventTypeName, EventTypeName),
            DisplayOrder = @DisplayOrder,
            IsActive = @IsActive,
            UpdatedAt = GETUTCDATE()
        WHERE EventTypeID = @EventTypeID;
        
        SELECT @EventTypeID AS EventTypeID, 'Event type updated successfully' AS Message;
    END
    ELSE IF @Action = 'delete'
    BEGIN
        UPDATE [admin].[EventTypes]
        SET IsActive = 0, UpdatedAt = GETUTCDATE()
        WHERE EventTypeID = @EventTypeID;
        
        SELECT @EventTypeID AS EventTypeID, 'Event type deactivated successfully' AS Message;
    END
END;
GO

PRINT 'Stored procedure [admin].[sp_Admin_ManageEventType] created successfully.';
GO
