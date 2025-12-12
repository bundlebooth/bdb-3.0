
-- NEW: Get all reviews for a specific vendor
CREATE   PROCEDURE sp_GetVendorReviewsAll
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT *
    FROM vw_VendorReviews
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY CreatedAt DESC;
END;

GO

