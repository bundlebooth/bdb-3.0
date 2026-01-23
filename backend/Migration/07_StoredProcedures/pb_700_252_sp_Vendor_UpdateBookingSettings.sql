-- =============================================
-- Stored Procedure: vendors.sp_UpdateBookingSettings
-- Description: Updates vendor booking settings
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpdateBookingSettings]'))
    DROP PROCEDURE [vendors].[sp_UpdateBookingSettings];
GO

CREATE PROCEDURE [vendors].[sp_UpdateBookingSettings]
    @VendorProfileID INT,
    @AcceptingBookings BIT = 0,
    @AverageResponseTime INT = 24
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles 
    SET AcceptingBookings = @AcceptingBookings, 
        AverageResponseTime = @AverageResponseTime,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

