-- Get cancellation policy for a vendor
-- Updated to query VendorCancellationPolicies table (same table used by sp_SaveCancellationPolicy)
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
        100 AS FullRefundPercent,
        PartialRefundPercent,
        PolicyDescription,
        AllowClientCancellation,
        AllowVendorCancellation,
        CancellationFee AS VendorCancellationPenalty,
        1 AS IsActive,
        CreatedAt,
        UpdatedAt
    FROM vendors.VendorCancellationPolicies
    WHERE VendorProfileID = @VendorProfileID;
END
GO
