
-- Indexed view for trending (views in last 7 days)
CREATE VIEW vw_VendorTrending
WITH SCHEMABINDING
AS
SELECT 
    VendorProfileID,
    COUNT_BIG(*) AS ViewCount7Days
FROM dbo.VendorProfileViews
WHERE ViewedAt >= DATEADD(DAY, -7, GETDATE())
GROUP BY VendorProfileID;

GO

