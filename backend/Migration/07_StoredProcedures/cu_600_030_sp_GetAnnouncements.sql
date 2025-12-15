/*
    Migration Script: Create Stored Procedure [sp_GetAnnouncements]
    Phase: 600 - Stored Procedures
    Script: cu_600_030_dbo.sp_GetAnnouncements.sql
    Description: Creates the [dbo].[sp_GetAnnouncements] stored procedure
    
    Execution Order: 30
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetAnnouncements]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetAnnouncements]'))
    DROP PROCEDURE [dbo].[sp_GetAnnouncements];
GO

CREATE   PROCEDURE [dbo].[sp_GetAnnouncements]
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

PRINT 'Stored procedure [dbo].[sp_GetAnnouncements] created successfully.';
GO
