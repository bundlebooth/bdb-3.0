
-- NEW: Get all reviews made by a specific user
CREATE   PROCEDURE sp_GetUserReviews
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        r.ReviewID,
        r.VendorProfileID,
        vp.BusinessName AS VendorName,
        r.BookingID,
        r.Rating,
        r.Title,
        r.Comment,
        r.CreatedAt,
        (SELECT TOP 1 vi.ImageURL FROM VendorImages vi WHERE vi.VendorProfileID = vp.VendorProfileID AND vi.IsPrimary = 1) AS VendorImage
    FROM Reviews r
    JOIN VendorProfiles vp ON r.VendorProfileID = vp.VendorProfileID
    WHERE r.UserID = @UserID
    ORDER BY r.CreatedAt DESC;
END;

GO

