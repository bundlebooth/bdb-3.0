-- =============================================
-- Stored Procedure: sp_UpdateCancellationPolicy
-- Description: Updates the cancellation policy for a vendor profile
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'vendors.sp_UpdateCancellationPolicy') AND type in (N'P', N'PC'))
    DROP PROCEDURE vendors.sp_UpdateCancellationPolicy
GO

CREATE PROCEDURE vendors.sp_UpdateCancellationPolicy
    @VendorProfileID INT,
    @CancellationPolicy NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles
    SET CancellationPolicy = @CancellationPolicy,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
