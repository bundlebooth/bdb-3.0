
-- Stored procedure to submit a review
CREATE   PROCEDURE sp_SubmitReview
    @UserID INT,
    @VendorProfileID INT,
    @Rating INT,
    @Comment NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Reviews (UserID, VendorProfileID, Rating, Comment, CreatedAt)
    VALUES (@UserID, @VendorProfileID, @Rating, @Comment, GETDATE());

    SELECT TOP 1 *
    FROM Reviews
    WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID
    ORDER BY CreatedAt DESC;
END

GO

