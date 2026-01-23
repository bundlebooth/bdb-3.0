-- =============================================
-- Stored Procedure: vendors.sp_DeleteBusinessHours
-- Description: Deletes all business hours for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_DeleteBusinessHours]'))
    DROP PROCEDURE [vendors].[sp_DeleteBusinessHours];
GO

CREATE PROCEDURE [vendors].[sp_DeleteBusinessHours]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM vendors.VendorBusinessHours WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO

