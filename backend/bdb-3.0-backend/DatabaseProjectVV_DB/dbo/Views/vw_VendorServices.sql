
-- Vendor services view
CREATE   VIEW vw_VendorServices AS
SELECT 
    s.ServiceID,
    s.CategoryID,
    sc.VendorProfileID,  -- Changed to get from ServiceCategories
    sc.Name AS CategoryName,
    v.BusinessName AS VendorName,
    s.Name AS ServiceName,
    s.Description,
    s.Price,
    s.DurationMinutes,
    s.MinDuration,
    s.MaxAttendees,
    s.RequiresDeposit,
    s.DepositPercentage,
    s.CancellationPolicy,
    (SELECT TOP 1 si.ImageURL FROM ServiceImages si WHERE si.ServiceID = s.ServiceID AND si.IsPrimary = 1) AS PrimaryImage,
    (SELECT COUNT(*) FROM Bookings b WHERE b.ServiceID = s.ServiceID) AS BookingCount
FROM Services s
JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID
JOIN VendorProfiles v ON sc.VendorProfileID = v.VendorProfileID
WHERE s.IsActive = 1;

GO

