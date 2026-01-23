-- =============================================
-- Stored Procedure: vendors.sp_GetAvailabilityExceptions
-- Description: Gets availability exceptions for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetAvailabilityExceptions]'))
    DROP PROCEDURE [vendors].[sp_GetAvailabilityExceptions];
GO

CREATE PROCEDURE [vendors].[sp_GetAvailabilityExceptions]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT Date, IsAvailable, Reason
    FROM vendors.VendorAvailabilityExceptions
    WHERE VendorProfileID = @VendorProfileID
    AND Date >= CAST(GETDATE() AS DATE)
    ORDER BY Date;
END
GO

