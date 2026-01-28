/*
    Migration Script: Create Stored Procedure [sp_Vendor_UpdateAttributes]
    Phase: 700 - Stored Procedures
    Script: pb_700_535_sp_Vendor_UpdateAttributes.sql
    Description: Updates vendor service location scope and experience range
    
    Execution Order: 535
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
    @ServiceLocationScope NVARCHAR(50) = NULL,
    @YearsOfExperienceRange NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE [vendors].[VendorProfiles]
    SET 
        ServiceLocationScope = COALESCE(@ServiceLocationScope, ServiceLocationScope),
        YearsOfExperienceRange = COALESCE(@YearsOfExperienceRange, YearsOfExperienceRange),
        UpdatedAt = GETUTCDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

PRINT 'Stored procedure [vendors].[sp_Vendor_UpdateAttributes] created successfully.';
GO
