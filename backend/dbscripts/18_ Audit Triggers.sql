-- Section 18: Audit Triggers

-- Create audit trigger for Users table
CREATE TRIGGER tr_Users_Audit
ON Users
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
GO
    DECLARE @ActionType NVARCHAR(50);
GO
    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @ActionType = 'UPDATE';
GO
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @ActionType = 'INSERT';
GO
    ELSE
        SET @ActionType = 'DELETE';
GO
    -- Get current user from application context or system user
    DECLARE @CurrentUser NVARCHAR(128);
GO
    SET @CurrentUser = ISNULL(CAST(CONTEXT_INFO() AS NVARCHAR(128)), SYSTEM_USER);
GO
    -- Log changes
    INSERT INTO AuditLogs (UserID, ActionType, TableName, RecordID, OldValues, NewValues, IPAddress)
    SELECT 
        ISNULL(i.UserID, d.UserID),
        @ActionType,
        'Users',
        ISNULL(CAST(i.UserID AS NVARCHAR(100)), CAST(d.UserID AS NVARCHAR(100))),
        (SELECT d.* FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
        (SELECT i.* FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
        NULL -- IP would be set by application
    FROM 
        inserted i
        FULL OUTER JOIN deleted d ON i.UserID = d.UserID
    WHERE 
        (i.UserID IS NOT NULL OR d.UserID IS NOT NULL);
GO
END;
GO

-- Create audit trigger for Bookings table
CREATE TRIGGER tr_Bookings_Audit
ON Bookings
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
GO
    DECLARE @ActionType NVARCHAR(50);
GO
    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
        SET @ActionType = 'UPDATE';
GO
    ELSE IF EXISTS (SELECT * FROM inserted)
        SET @ActionType = 'INSERT';
GO
    ELSE
        SET @ActionType = 'DELETE';
GO
    -- Get current user from application context or system user
    DECLARE @CurrentUser NVARCHAR(128);
GO
    SET @CurrentUser = ISNULL(CAST(CONTEXT_INFO() AS NVARCHAR(128)), SYSTEM_USER);
GO
    -- Log changes
    INSERT INTO AuditLogs (UserID, ActionType, TableName, RecordID, OldValues, NewValues, IPAddress)
    SELECT 
        ISNULL(i.UserID, d.UserID),
        @ActionType,
        'Bookings',
        ISNULL(CAST(i.BookingID AS NVARCHAR(100)), CAST(d.BookingID AS NVARCHAR(100))),
        (SELECT d.* FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
        (SELECT i.* FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
        NULL -- IP would be set by application
    FROM 
        inserted i
        FULL OUTER JOIN deleted d ON i.BookingID = d.BookingID
    WHERE 
        (i.BookingID IS NOT NULL OR d.BookingID IS NOT NULL);
GO
END;
GO

