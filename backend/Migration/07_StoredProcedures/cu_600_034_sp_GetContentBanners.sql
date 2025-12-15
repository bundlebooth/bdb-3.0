/*
    Migration Script: Create Stored Procedure [sp_GetContentBanners]
    Phase: 600 - Stored Procedures
    Script: cu_600_034_dbo.sp_GetContentBanners.sql
    Description: Creates the [dbo].[sp_GetContentBanners] stored procedure
    
    Execution Order: 34
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetContentBanners]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetContentBanners]'))
    DROP PROCEDURE [dbo].[sp_GetContentBanners];
GO

CREATE   PROCEDURE [dbo].[sp_GetContentBanners]
    @ActiveOnly BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        BannerID,
        Title,
        Subtitle,
        ImageURL,
        LinkURL,
        LinkText,
        BackgroundColor,
        TextColor,
        Position,
        DisplayOrder,
        StartDate,
        EndDate,
        IsActive,
        CreatedAt
    FROM ContentBanners
    WHERE @ActiveOnly = 0 OR (IsActive = 1 AND (StartDate IS NULL OR StartDate <= GETUTCDATE()) AND (EndDate IS NULL OR EndDate >= GETUTCDATE()))
    ORDER BY DisplayOrder, CreatedAt DESC;
END;
GO

PRINT 'Stored procedure [dbo].[sp_GetContentBanners] created successfully.';
GO
