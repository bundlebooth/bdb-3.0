-- Section 9: Views

-- vw_VenueSearchResults: Consolidated provider data for search
CREATE VIEW vw_ProviderSearchResults AS
SELECT 
    sp.ProviderID,
    sp.BusinessName,
    sp.BusinessDescription,
    pt.TypeName AS ProviderType,
    pt.Category AS ProviderCategory,
    pl.City,
    pl.StateProvince,
    pl.Country,
    pl.Latitude,
    pl.Longitude,
    ISNULL((SELECT AVG(CAST(pr.Rating AS DECIMAL(5,2))) FROM ProviderReviews pr WHERE pr.ProviderID = sp.ProviderID AND pr.IsApproved = 1), 0) AS AverageRating,
    ISNULL((SELECT COUNT(*) FROM ProviderReviews pr WHERE pr.ProviderID = sp.ProviderID AND pr.IsApproved = 1), 0) AS ReviewCount,
    sp.BasePrice,
    sp.IsFeatured,
    sp.IsVerified,
    (SELECT TOP 1 ImageURL FROM ProviderPortfolio pp WHERE pp.ProviderID = sp.ProviderID ORDER BY pp.IsFeatured DESC, pp.DisplayOrder) AS PrimaryImage
FROM 
    ServiceProviders sp
    INNER JOIN ProviderTypes pt ON sp.TypeID = pt.TypeID
    LEFT JOIN ProviderLocations pl ON sp.ProviderID = pl.ProviderID AND pl.IsPrimary = 1
WHERE 
    sp.IsActive = 1;
GO
-- vw_UserBookings: All bookings for a user
CREATE VIEW vw_UserBookings AS
SELECT 
    b.BookingID,
    b.EventName,
    b.EventDate,
    b.StartTime,
    b.EndTime,
    b.GuestCount,
    b.TotalPrice,
    b.DepositAmount,
    b.DepositPaid,
    b.BalanceDueDate,
    bs.StatusName AS BookingStatus,
    et.TypeName AS EventType,
    u.FirstName + ' ' + u.LastName AS CustomerName,
    u.Email AS CustomerEmail,
    u.PhoneNumber AS CustomerPhone,
    DATEDIFF(DAY, GETDATE(), b.EventDate) AS DaysUntilEvent,
    (SELECT COUNT(*) FROM BookingProviders bp WHERE bp.BookingID = b.BookingID) AS ProviderCount
FROM 
    Bookings b
    INNER JOIN BookingStatuses bs ON b.StatusID = bs.StatusID
    INNER JOIN EventTypes et ON b.EventTypeID = et.EventTypeID
    INNER JOIN Users u ON b.UserID = u.UserID;
GO
-- vw_ProviderDashboard: Summary for service providers
CREATE VIEW vw_ProviderDashboard AS
SELECT 
    sp.ProviderID,
    sp.BusinessName,
    pt.TypeName AS ProviderType,
    u.FirstName + ' ' + u.LastName AS OwnerName,
    u.Email AS OwnerEmail,
    (SELECT COUNT(*) FROM Bookings b INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID WHERE bp.ProviderID = sp.ProviderID AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))) AS ActiveBookings,
    (SELECT COUNT(*) FROM Bookings b INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID WHERE bp.ProviderID = sp.ProviderID AND b.EventDate >= GETDATE() AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed'))) AS UpcomingBookings,
    (SELECT SUM(bp.Price) FROM Bookings b INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID WHERE bp.ProviderID = sp.ProviderID AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed')) AND YEAR(b.EventDate) = YEAR(GETDATE())) AS YTDRevenue,
    (SELECT AVG(CAST(pr.Rating AS DECIMAL(5,2))) FROM ProviderReviews pr WHERE pr.ProviderID = sp.ProviderID AND pr.IsApproved = 1) AS AverageRating,
    (SELECT COUNT(*) FROM ProviderReviews pr WHERE pr.ProviderID = sp.ProviderID AND pr.IsApproved = 1) AS ReviewCount,
    (SELECT COUNT(*) FROM Wishlists w WHERE w.ProviderID = sp.ProviderID) AS WishlistCount
FROM 
    ServiceProviders sp
    INNER JOIN ProviderTypes pt ON sp.TypeID = pt.TypeID
    INNER JOIN Users u ON sp.UserID = u.UserID;
GO
-- vw_RevenueByProvider: Financial performance by provider
CREATE VIEW vw_RevenueByProvider AS
SELECT 
    sp.ProviderID,
    sp.BusinessName,
    pt.TypeName AS ProviderType,
    YEAR(b.EventDate) AS Year,
    MONTH(b.EventDate) AS Month,
    COUNT(DISTINCT b.BookingID) AS BookingCount,
    SUM(bp.Price) AS GrossRevenue,
    SUM(p.FeeAmount) AS FeesCollected,
    SUM(p.NetAmount) AS NetRevenue,
    (SELECT SUM(po.Amount) FROM Payouts po WHERE po.ProviderID = sp.ProviderID AND YEAR(po.PayoutDate) = YEAR(b.EventDate) AND MONTH(po.PayoutDate) = MONTH(b.EventDate)) AS Payouts
FROM 
    Bookings b
    INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
    INNER JOIN Payments p ON bp.BookingProviderID = p.BookingID AND p.ProviderID = bp.ProviderID
    INNER JOIN ServiceProviders sp ON bp.ProviderID = sp.ProviderID
    INNER JOIN ProviderTypes pt ON sp.TypeID = pt.TypeID
WHERE 
    p.Status = 'Completed'
GROUP BY 
    sp.ProviderID, sp.BusinessName, pt.TypeName, YEAR(b.EventDate), MONTH(b.EventDate);
GO
-- vw_AvailabilityCalendar: Visual representation of availability
CREATE VIEW vw_AvailabilityCalendar AS
WITH DateRange AS (
    SELECT DATEADD(DAY, number, GETDATE()) AS CalendarDate
    FROM master.dbo.spt_values
    WHERE type = 'P' AND number BETWEEN 0 AND 365 -- Next year
)
SELECT 
    p.ProviderID,
    p.BusinessName,
    pt.TypeName AS ProviderType,
    dr.CalendarDate,
    CASE 
        WHEN EXISTS (SELECT 1 FROM ProviderBlackoutDates bd WHERE bd.ProviderID = p.ProviderID AND dr.CalendarDate BETWEEN bd.StartDate AND bd.EndDate) THEN 0
        WHEN EXISTS (
            SELECT 1 FROM Bookings b 
            INNER JOIN BookingProviders bp ON b.BookingID = bp.BookingID
            WHERE bp.ProviderID = p.ProviderID 
            AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed', 'Completed'))
            AND dr.CalendarDate = b.EventDate
        ) THEN 0
        WHEN EXISTS (
            SELECT 1 FROM ProviderAvailability pa 
            WHERE pa.ProviderID = p.ProviderID 
            AND pa.DayOfWeek = DATEPART(WEEKDAY, dr.CalendarDate)
            AND pa.IsAvailable = 1
        ) THEN 1
        ELSE 0
    END AS IsAvailable
FROM 
    ServiceProviders p
    CROSS JOIN DateRange dr
    INNER JOIN ProviderTypes pt ON p.TypeID = pt.TypeID
WHERE 
    p.IsActive = 1;
GO
-- vw_CustomerFavorites: User's saved providers
CREATE VIEW vw_CustomerFavorites AS
SELECT 
    w.WishlistID,
    w.UserID,
    u.FirstName + ' ' + u.LastName AS CustomerName,
    w.ProviderID,
    sp.BusinessName,
    pt.TypeName AS ProviderType,
    (SELECT AVG(CAST(pr.Rating AS DECIMAL(5,2))) FROM ProviderReviews pr WHERE pr.ProviderID = sp.ProviderID AND pr.IsApproved = 1) AS AverageRating,
    (SELECT COUNT(*) FROM ProviderReviews pr WHERE pr.ProviderID = sp.ProviderID AND pr.IsApproved = 1) AS ReviewCount,
    sp.BasePrice,
    (SELECT TOP 1 ImageURL FROM ProviderPortfolio pp WHERE pp.ProviderID = sp.ProviderID ORDER BY pp.IsFeatured DESC, pp.DisplayOrder) AS PrimaryImage,
    w.CreatedDate AS AddedDate
FROM 
    Wishlists w
    INNER JOIN Users u ON w.UserID = u.UserID
    INNER JOIN ServiceProviders sp ON w.ProviderID = sp.ProviderID
    INNER JOIN ProviderTypes pt ON sp.TypeID = pt.TypeID;
GO
-- vw_TopRatedProviders: Highest rated providers
CREATE VIEW vw_TopRatedProviders AS
SELECT 
    sp.ProviderID,
    sp.BusinessName,
    pt.TypeName AS ProviderType,
    pt.Category AS ProviderCategory,
    AVG(CAST(pr.Rating AS DECIMAL(5,2))) AS AverageRating,
    COUNT(pr.ReviewID) AS ReviewCount,
    sp.BasePrice,
    (SELECT TOP 1 ImageURL FROM ProviderPortfolio pp WHERE pp.ProviderID = sp.ProviderID ORDER BY pp.IsFeatured DESC, pp.DisplayOrder) AS PrimaryImage,
    pl.City,
    pl.StateProvince,
    pl.Country
FROM 
    ServiceProviders sp
    INNER JOIN ProviderTypes pt ON sp.TypeID = pt.TypeID
    INNER JOIN ProviderReviews pr ON sp.ProviderID = pr.ProviderID
    LEFT JOIN ProviderLocations pl ON sp.ProviderID = pl.ProviderID AND pl.IsPrimary = 1
WHERE 
    sp.IsActive = 1 AND pr.IsApproved = 1
GROUP BY 
    sp.ProviderID, sp.BusinessName, pt.TypeName, pt.Category, sp.BasePrice, pl.City, pl.StateProvince, pl.Country
HAVING 
    COUNT(pr.ReviewID) >= 5;
GO
-- vw_UpcomingBookings: Bookings in next 30 days
CREATE VIEW vw_UpcomingBookings AS
SELECT 
    b.BookingID,
    b.EventName,
    b.EventDate,
    b.StartTime,
    b.EndTime,
    b.GuestCount,
    u.FirstName + ' ' + u.LastName AS CustomerName,
    u.Email AS CustomerEmail,
    u.PhoneNumber AS CustomerPhone,
    et.TypeName AS EventType,
    bs.StatusName AS BookingStatus,
    DATEDIFF(DAY, GETDATE(), b.EventDate) AS DaysUntilEvent,
    (SELECT STRING_AGG(sp.BusinessName, ', ') 
     FROM BookingProviders bp 
     INNER JOIN ServiceProviders sp ON bp.ProviderID = sp.ProviderID
     WHERE bp.BookingID = b.BookingID) AS Providers
FROM 
    Bookings b
    INNER JOIN Users u ON b.UserID = u.UserID
    INNER JOIN EventTypes et ON b.EventTypeID = et.EventTypeID
    INNER JOIN BookingStatuses bs ON b.StatusID = bs.StatusID
WHERE 
    b.EventDate BETWEEN GETDATE() AND DATEADD(DAY, 30, GETDATE())
    AND b.StatusID IN (SELECT StatusID FROM BookingStatuses WHERE StatusName IN ('Confirmed'));
GO
