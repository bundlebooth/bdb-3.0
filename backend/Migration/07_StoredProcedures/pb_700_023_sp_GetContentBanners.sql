/*
    Migration Script: Create Stored Procedure [sp_GetContentBanners]
    Phase: 600 - Stored Procedures
    Script: cu_600_034_dbo.sp_GetContentBanners.sql
    Description: Creates the [admin].[sp_GetContentBanners] stored procedure
    
    Execution Order: 34
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [admin].[sp_GetContentBanners]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetContentBanners]'))
    DROP PROCEDURE [admin].[sp_GetContentBanners];
GO

CREATE   PROCEDURE [admin].[sp_GetContentBanners]
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

PRINT 'Stored procedure [admin].[sp_GetContentBanners] created successfully.';
GO
