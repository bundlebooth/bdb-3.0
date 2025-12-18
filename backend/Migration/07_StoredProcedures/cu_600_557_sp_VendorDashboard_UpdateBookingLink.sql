-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_UpdateBookingLink
-- Description: Updates vendor booking link
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_UpdateBookingLink]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_UpdateBookingLink];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_UpdateBookingLink]
    @VendorProfileID INT,
    @BookingLink NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles SET BookingLink = @BookingLink, UpdatedAt = GETDATE() WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

