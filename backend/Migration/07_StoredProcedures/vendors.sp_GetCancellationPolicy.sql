-- Get cancellation policy for a vendor
CREATE OR ALTER PROCEDURE vendors.sp_GetCancellationPolicy
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        PolicyID,
        VendorProfileID,
        PolicyName,
        FullRefundHours,
        PartialRefundHours,
        NoRefundHours,
        FullRefundPercent,
        PartialRefundPercent,
        PolicyDescription,
        AllowClientCancellation,
        AllowVendorCancellation,
        VendorCancellationPenalty,
        IsActive,
        CreatedAt,
        UpdatedAt
    FROM vendors.CancellationPolicies
    WHERE VendorProfileID = @VendorProfileID
      AND IsActive = 1;
END
GO
