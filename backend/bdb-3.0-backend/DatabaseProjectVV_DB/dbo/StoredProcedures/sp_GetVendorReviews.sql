
-- Stored procedure to get reviews for a vendor
CREATE   PROCEDURE sp_GetVendorReviews
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        r.ReviewID,
        u.Name AS ReviewerName,
        r.Rating,
        r.Comment,
        r.CreatedAt
    FROM Reviews r
    LEFT JOIN Users u ON r.UserID = u.UserID
    WHERE r.VendorProfileID = @VendorProfileID
    ORDER BY r.CreatedAt DESC;
END

GO

