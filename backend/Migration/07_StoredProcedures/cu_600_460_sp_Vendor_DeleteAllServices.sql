-- =============================================
-- Stored Procedure: vendors.sp_DeleteAllServices
-- Description: Deletes all services for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_DeleteAllServices]'))
    DROP PROCEDURE [vendors].[sp_DeleteAllServices];
GO

CREATE PROCEDURE [vendors].[sp_DeleteAllServices]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM vendors.Services WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
