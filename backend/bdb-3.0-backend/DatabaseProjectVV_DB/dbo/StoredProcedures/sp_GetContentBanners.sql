
-- NOTE: Email templates already exist in EmailTemplates table
-- Use existing sp_GetEmailTemplates and sp_LogEmail procedures

-- Get content banners
CREATE   PROCEDURE sp_GetContentBanners
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

