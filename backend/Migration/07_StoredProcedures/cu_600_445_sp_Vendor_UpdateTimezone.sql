-- =============================================
-- Stored Procedure: vendors.sp_UpdateTimezone
-- Description: Updates vendor timezone
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpdateTimezone]'))
    DROP PROCEDURE [vendors].[sp_UpdateTimezone];
GO

CREATE PROCEDURE [vendors].[sp_UpdateTimezone]
    @VendorProfileID INT,
    @Timezone NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Note: Timezone column does not exist in VendorProfiles table
    -- This SP only updates the UpdatedAt timestamp until Timezone column is added
    UPDATE vendors.VendorProfiles 
    SET UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

