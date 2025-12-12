
CREATE PROCEDURE sp_GetPremiumVendors
    @City NVARCHAR(100) = NULL,
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit) vp.*,
        ISNULL(vt.ViewCount7Days, 0) AS ViewCount7Days
    FROM VendorProfiles vp
    LEFT JOIN (
        SELECT VendorProfileID, COUNT(*) AS ViewCount7Days
        FROM VendorProfileViews
        WHERE ViewedAt >= DATEADD(DAY, -7, GETDATE())
        GROUP BY VendorProfileID
    ) vt ON vp.VendorProfileID = vt.VendorProfileID
    WHERE ISNULL(vp.IsVisible, 0) = 1
      AND (@City IS NULL OR vp.City = @City)
      AND vp.IsPremium = 1
    ORDER BY ISNULL(vt.ViewCount7Days, 0) DESC, vp.TotalBookings DESC, vp.AvgRating DESC;
END

GO

