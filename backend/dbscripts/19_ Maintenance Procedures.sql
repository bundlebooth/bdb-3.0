-- Section 19: Maintenance Procedures

-- Procedure to clean up old sessions
CREATE PROCEDURE sp_CleanupOldSessions
    @DaysToKeep INT = 30
AS
BEGIN
    SET NOCOUNT ON;
GO
    DELETE FROM UserSessions
    WHERE ExpiryDate < GETDATE() OR LastActivityDate < DATEADD(DAY, -@DaysToKeep, GETDATE());
GO
    RETURN @@ROWCOUNT;
GO
END;
GO

-- Procedure to archive old bookings
CREATE PROCEDURE sp_ArchiveCompletedBookings
    @MonthsToKeep INT = 12
AS
BEGIN
    SET NOCOUNT ON;
GO
    -- In a real system, you would move these to an archive table first
    -- This is just a simplified example
    
    DECLARE @ArchivedCount INT = 0;
GO
    -- Archive bookings completed more than @MonthsToKeep ago
    SELECT @ArchivedCount = COUNT(*)
    FROM Bookings b
    INNER JOIN BookingStatuses bs ON b.StatusID = bs.StatusID
    WHERE bs.StatusName = 'Completed'
    AND b.EventDate < DATEADD(MONTH, -@MonthsToKeep, GETDATE());
GO
    -- In a real implementation, you would:
    -- 1. Insert into archive tables
    -- 2. Delete related records (messages, timeline events, etc.)
    -- 3. Delete the bookings
    
    -- For this example, we'll just return the count that would be archived
    RETURN @ArchivedCount;
GO
END;
GO

-- Procedure to rebuild indexes
CREATE PROCEDURE sp_RebuildIndexes
AS
BEGIN
    SET NOCOUNT ON;
GO
    DECLARE @TableName NVARCHAR(255);
GO
    DECLARE @SQL NVARCHAR(500);
GO
    DECLARE TableCursor CURSOR FOR
    SELECT table_name
    FROM information_schema.tables
    WHERE table_type = 'BASE TABLE'
    AND table_name NOT LIKE 'sys%';
GO
    OPEN TableCursor;
GO
    FETCH NEXT FROM TableCursor INTO @TableName;
GO
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @SQL = 'ALTER INDEX ALL ON ' + @TableName + ' REBUILD';
GO
        EXEC sp_executesql @SQL;
GO
        FETCH NEXT FROM TableCursor INTO @TableName;
GO
    END
    
    CLOSE TableCursor;
GO
    DEALLOCATE TableCursor;
GO
END;
GO

