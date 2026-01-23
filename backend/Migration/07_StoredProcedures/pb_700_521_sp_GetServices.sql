/*
    Migration Script: Create Stored Procedure [vendors].[sp_GetServices]
*/

SET NOCOUNT ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetServices]'))
    DROP PROCEDURE [vendors].[sp_GetServices];
GO


CREATE PROCEDURE [vendors].[sp_GetServices]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        sc.CategoryID,
        sc.Name AS CategoryName,
        sc.Description AS CategoryDescription,
        s.ServiceID,
        s.Name AS ServiceName,
        s.Description AS ServiceDescription,
        s.Price,
        s.DurationMinutes,
        s.MinDuration,
        s.MaxAttendees,
        s.IsActive,
        s.RequiresDeposit,
        s.DepositPercentage,
        s.CancellationPolicy,
        NULL AS PrimaryImage
    FROM vendors.ServiceCategories sc
    JOIN vendors.Services s ON sc.CategoryID = s.CategoryID
    WHERE sc.VendorProfileID = @VendorProfileID
    ORDER BY sc.DisplayOrder, sc.Name, s.Name;
END;
GO
