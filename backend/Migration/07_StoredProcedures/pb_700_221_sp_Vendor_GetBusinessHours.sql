-- =============================================
-- Stored Procedure: vendors.sp_GetBusinessHours
-- Description: Gets business hours for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetBusinessHours]'))
    DROP PROCEDURE [vendors].[sp_GetBusinessHours];
GO

CREATE PROCEDURE [vendors].[sp_GetBusinessHours]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT DayOfWeek, IsAvailable, OpenTime, CloseTime
    FROM vendors.VendorBusinessHours
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY DayOfWeek;
END
GO

