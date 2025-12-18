-- =============================================
-- Stored Procedure: sp_Vendor_UpdateTimezone
-- Description: Updates vendor timezone
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_UpdateTimezone]'))
    DROP PROCEDURE [dbo].[sp_Vendor_UpdateTimezone];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_UpdateTimezone]
    @VendorProfileID INT,
    @Timezone NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Note: Timezone column does not exist in VendorProfiles table
    -- This SP only updates the UpdatedAt timestamp until Timezone column is added
    UPDATE VendorProfiles 
    SET UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
