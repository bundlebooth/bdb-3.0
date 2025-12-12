
-- Get booking requests for a user
CREATE   PROCEDURE sp_GetUserBookingRequests
    @UserID INT,
    @Status NVARCHAR(50) = NULL,
    @PageSize INT = 20,
    @PageNumber INT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    SELECT 
        br.RequestID,
        br.VendorProfileID,
        vp.BusinessName AS VendorName,
        vp.LogoURL AS VendorImage,
        br.ServiceID,
        s.Name AS ServiceName,
        br.EventDate,
        br.EventTime,
        br.EventLocation,
        br.AttendeeCount,
        br.Budget,
        br.SpecialRequests,
        br.Status,
        br.ProposedPrice,
        br.ResponseMessage,
        br.CreatedAt,
        br.ExpiresAt,
        br.RespondedAt,
        CASE 
            WHEN br.ExpiresAt < GETDATE() AND br.Status = 'pending' THEN 1
            ELSE 0
        END AS IsExpired,
        (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) 
         FROM Reviews r 
         WHERE r.VendorProfileID = br.VendorProfileID AND r.IsApproved = 1) AS VendorRating,
        (SELECT COUNT(*) 
         FROM Reviews r 
         WHERE r.VendorProfileID = br.VendorProfileID AND r.IsApproved = 1) AS VendorReviewCount
    FROM BookingRequests br
    JOIN VendorProfiles vp ON br.VendorProfileID = vp.VendorProfileID
    LEFT JOIN Services s ON br.ServiceID = s.ServiceID
    WHERE br.UserID = @UserID
        AND (@Status IS NULL OR br.Status = @Status)
    ORDER BY br.CreatedAt DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;

GO

