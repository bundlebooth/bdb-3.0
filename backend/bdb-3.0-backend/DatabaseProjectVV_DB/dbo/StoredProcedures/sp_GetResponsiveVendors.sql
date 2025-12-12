
CREATE PROCEDURE sp_GetResponsiveVendors
    @City NVARCHAR(100) = NULL,
    @Limit INT = 10
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit) vp.*,
        vrt.AvgResponseMinutes
    FROM VendorProfiles vp
    INNER JOIN (
        SELECT c.VendorProfileID, 
               AVG(DATEDIFF(MINUTE, m_user.CreatedAt, m_vendor.CreatedAt)) AS AvgResponseMinutes
        FROM Conversations c
        INNER JOIN Messages m_user ON c.ConversationID = m_user.ConversationID AND m_user.SenderID = c.UserID
        INNER JOIN Messages m_vendor ON c.ConversationID = m_vendor.ConversationID AND m_vendor.SenderID != c.UserID
        WHERE m_vendor.CreatedAt > m_user.CreatedAt
        GROUP BY c.VendorProfileID
        HAVING AVG(DATEDIFF(MINUTE, m_user.CreatedAt, m_vendor.CreatedAt)) <= 120
    ) vrt ON vp.VendorProfileID = vrt.VendorProfileID
    WHERE ISNULL(vp.IsVisible, 0) = 1
      AND (@City IS NULL OR vp.City = @City)
    ORDER BY vrt.AvgResponseMinutes ASC;
END

GO

