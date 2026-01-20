-- Create or update cancellation policy for a vendor
CREATE OR ALTER PROCEDURE vendors.sp_UpsertCancellationPolicy
    @VendorProfileID INT,
    @PolicyName NVARCHAR(100) = 'Standard Policy',
    @FullRefundHours INT = 168,
    @PartialRefundHours INT = 48,
    @NoRefundHours INT = 24,
    @FullRefundPercent DECIMAL(5,2) = 100.00,
    @PartialRefundPercent DECIMAL(5,2) = 50.00,
    @PolicyDescription NVARCHAR(MAX) = NULL,
    @AllowClientCancellation BIT = 1,
    @AllowVendorCancellation BIT = 1,
    @VendorCancellationPenalty DECIMAL(5,2) = 0.00
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM vendors.CancellationPolicies WHERE VendorProfileID = @VendorProfileID)
    BEGIN
        UPDATE vendors.CancellationPolicies
        SET PolicyName = @PolicyName,
            FullRefundHours = @FullRefundHours,
            PartialRefundHours = @PartialRefundHours,
            NoRefundHours = @NoRefundHours,
            FullRefundPercent = @FullRefundPercent,
            PartialRefundPercent = @PartialRefundPercent,
            PolicyDescription = @PolicyDescription,
            AllowClientCancellation = @AllowClientCancellation,
            AllowVendorCancellation = @AllowVendorCancellation,
            VendorCancellationPenalty = @VendorCancellationPenalty,
            UpdatedAt = GETDATE()
        WHERE VendorProfileID = @VendorProfileID;
        
        SELECT PolicyID FROM vendors.CancellationPolicies WHERE VendorProfileID = @VendorProfileID;
    END
    ELSE
    BEGIN
        INSERT INTO vendors.CancellationPolicies (
            VendorProfileID, PolicyName, FullRefundHours, PartialRefundHours, NoRefundHours,
            FullRefundPercent, PartialRefundPercent, PolicyDescription,
            AllowClientCancellation, AllowVendorCancellation, VendorCancellationPenalty
        )
        OUTPUT INSERTED.PolicyID
        VALUES (
            @VendorProfileID, @PolicyName, @FullRefundHours, @PartialRefundHours, @NoRefundHours,
            @FullRefundPercent, @PartialRefundPercent, @PolicyDescription,
            @AllowClientCancellation, @AllowVendorCancellation, @VendorCancellationPenalty
        );
    END
END
GO
