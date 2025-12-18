-- =============================================
-- Stored Procedure: sp_VendorDashboard_GetExistingHoursId
-- Description: Gets existing business hours ID for vendor/day
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_GetExistingHoursId]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_GetExistingHoursId];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_GetExistingHoursId]
    @VendorProfileID INT,
    @DayOfWeek TINYINT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT HoursID FROM VendorBusinessHours WHERE VendorProfileID = @VendorProfileID AND DayOfWeek = @DayOfWeek;
END
GO
