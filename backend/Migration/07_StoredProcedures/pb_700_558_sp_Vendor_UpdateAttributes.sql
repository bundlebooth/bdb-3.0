/*
    Migration Script: Create Stored Procedure [sp_Vendor_UpdateAttributes]
    Phase: 700 - Stored Procedures
    Script: pb_700_558_sp_Vendor_UpdateAttributes.sql
    Description: Updates vendor profile attributes (service location, experience, affordability, price)
    
    Execution Order: 558
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_Vendor_UpdateAttributes]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Vendor_UpdateAttributes]'))
    DROP PROCEDURE [vendors].[sp_Vendor_UpdateAttributes];
GO

CREATE PROCEDURE [vendors].[sp_Vendor_UpdateAttributes]
    @VendorProfileID INT,
    @ServiceLocationScope NVARCHAR(20) = NULL,
    @YearsOfExperienceRange NVARCHAR(20) = NULL,
    @PriceType NVARCHAR(20) = NULL,
    @BasePrice DECIMAL(10,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE [vendors].[VendorProfiles]
    SET 
        ServiceLocationScope = COALESCE(@ServiceLocationScope, ServiceLocationScope),
        YearsOfExperienceRange = COALESCE(@YearsOfExperienceRange, YearsOfExperienceRange),
        PriceType = COALESCE(@PriceType, PriceType),
        BasePrice = COALESCE(@BasePrice, BasePrice),
        UpdatedAt = GETUTCDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

PRINT 'Stored procedure [vendors].[sp_Vendor_UpdateAttributes] created successfully.';
GO
