
-- Stored procedure to get predefined services by category
CREATE   PROCEDURE sp_GetPredefinedServicesByCategory
    @Category NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        PredefinedServiceID,
        Category,
        ServiceName,
        ServiceDescription,
        DefaultDurationMinutes,
        DisplayOrder
    FROM PredefinedServices
    WHERE IsActive = 1
        AND (@Category IS NULL OR Category = @Category)
    ORDER BY Category, DisplayOrder, ServiceName;
END

GO

