
-- Stored procedure to get vendor's selected services
CREATE   PROCEDURE sp_GetVendorSelectedServices
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        vss.VendorSelectedServiceID,
        ps.PredefinedServiceID,
        ps.Category,
        ps.ServiceName,
        ps.ServiceDescription,
        ps.DefaultDurationMinutes,
        vss.VendorPrice,
        vss.VendorDurationMinutes,
        vss.VendorDescription,
        vss.ImageURL,
        vss.VendorPrice AS FinalPrice,
        COALESCE(vss.VendorDurationMinutes, ps.DefaultDurationMinutes) AS FinalDurationMinutes,
        COALESCE(vss.VendorDescription, ps.ServiceDescription) AS FinalDescription
    FROM VendorSelectedServices vss
    JOIN PredefinedServices ps ON vss.PredefinedServiceID = ps.PredefinedServiceID
    WHERE vss.VendorProfileID = @VendorProfileID
        AND vss.IsActive = 1
        AND ps.IsActive = 1
    ORDER BY ps.Category, ps.DisplayOrder, ps.ServiceName;
END

GO

