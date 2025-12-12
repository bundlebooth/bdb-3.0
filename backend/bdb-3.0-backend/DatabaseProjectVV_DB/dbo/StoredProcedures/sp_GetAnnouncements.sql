
-- Get announcements
CREATE   PROCEDURE sp_GetAnnouncements
    @ActiveOnly BIT = 0,
    @TargetAudience NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        AnnouncementID,
        Title,
        Content,
        Type,
        Icon,
        LinkURL,
        LinkText,
        DisplayType,
        TargetAudience,
        StartDate,
        EndDate,
        IsActive,
        IsDismissible,
        DisplayOrder,
        ViewCount,
        DismissCount,
        CreatedAt
    FROM Announcements
    WHERE (@ActiveOnly = 0 OR (IsActive = 1 AND (StartDate IS NULL OR StartDate <= GETUTCDATE()) AND (EndDate IS NULL OR EndDate >= GETUTCDATE())))
        AND (@TargetAudience IS NULL OR TargetAudience = 'all' OR TargetAudience = @TargetAudience)
    ORDER BY DisplayOrder, CreatedAt DESC;
END;

GO

