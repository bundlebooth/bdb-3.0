-- =============================================
-- Stored Procedure: vendors.sp_UpdateBookingLink
-- Description: Updates vendor booking link
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpdateBookingLink]'))
    DROP PROCEDURE [vendors].[sp_UpdateBookingLink];
GO

CREATE PROCEDURE [vendors].[sp_UpdateBookingLink]
    @VendorProfileID INT,
    @BookingLink NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles 
    SET BookingLink = @BookingLink, UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

