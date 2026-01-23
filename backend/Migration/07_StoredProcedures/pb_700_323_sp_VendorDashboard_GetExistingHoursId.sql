-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_GetExistingHoursId
-- Description: Gets existing business hours ID for vendor/day
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_GetExistingHoursId]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_GetExistingHoursId];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_GetExistingHoursId]
    @VendorProfileID INT,
    @DayOfWeek TINYINT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT HoursID FROM vendors.VendorBusinessHours WHERE VendorProfileID = @VendorProfileID AND DayOfWeek = @DayOfWeek;
END
GO

