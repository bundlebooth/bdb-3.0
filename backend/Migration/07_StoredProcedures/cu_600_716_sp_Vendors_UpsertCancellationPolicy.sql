/*
    Migration Script: Create Stored Procedure [vendors].[sp_UpsertCancellationPolicy]
    Description: Upserts a cancellation policy for a vendor
                 Uses VendorCancellationPolicies table
    
    Execution Order: 716
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_UpsertCancellationPolicy]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpsertCancellationPolicy]'))
    DROP PROCEDURE [vendors].[sp_UpsertCancellationPolicy];
GO

CREATE PROCEDURE [vendors].[sp_UpsertCancellationPolicy]
    @VendorProfileID INT,
    @PolicyName NVARCHAR(100) = 'Standard Policy',
    @PolicyDescription NVARCHAR(MAX) = NULL,
    @FullRefundHours INT = 48,
    @PartialRefundHours INT = 24,
    @PartialRefundPercent DECIMAL(5,2) = 50,
    @NoRefundHours INT = 0,
    @AllowClientCancellation BIT = 1,
    @AllowVendorCancellation BIT = 1,
    @CancellationFee DECIMAL(10,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM vendors.VendorCancellationPolicies WHERE VendorProfileID = @VendorProfileID)
    BEGIN
        UPDATE vendors.VendorCancellationPolicies
        SET PolicyName = @PolicyName,
            PolicyDescription = @PolicyDescription,
            FullRefundHours = @FullRefundHours,
            PartialRefundHours = @PartialRefundHours,
            PartialRefundPercent = @PartialRefundPercent,
            NoRefundHours = @NoRefundHours,
            AllowClientCancellation = @AllowClientCancellation,
            AllowVendorCancellation = @AllowVendorCancellation,
            CancellationFee = @CancellationFee,
            UpdatedAt = GETDATE()
        WHERE VendorProfileID = @VendorProfileID;
    END
    ELSE
    BEGIN
        INSERT INTO vendors.VendorCancellationPolicies (
            VendorProfileID, PolicyName, PolicyDescription, 
            FullRefundHours, PartialRefundHours, PartialRefundPercent, 
            NoRefundHours, AllowClientCancellation, AllowVendorCancellation, 
            CancellationFee, IsActive, CreatedAt, UpdatedAt
        )
        VALUES (
            @VendorProfileID, @PolicyName, @PolicyDescription, 
            @FullRefundHours, @PartialRefundHours, @PartialRefundPercent, 
            @NoRefundHours, @AllowClientCancellation, @AllowVendorCancellation, 
            @CancellationFee, 1, GETDATE(), GETDATE()
        );
    END
    
    SELECT PolicyID FROM vendors.VendorCancellationPolicies WHERE VendorProfileID = @VendorProfileID;
END;
GO

PRINT 'Stored procedure [vendors].[sp_UpsertCancellationPolicy] created successfully.';
GO
