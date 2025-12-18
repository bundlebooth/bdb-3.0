-- =============================================
-- Stored Procedure: sp_Vendor_InsertBusinessHourSimple
-- Description: Inserts a business hour for a vendor (simple version)
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_InsertBusinessHourSimple]'))
    DROP PROCEDURE [dbo].[sp_Vendor_InsertBusinessHourSimple];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_InsertBusinessHourSimple]
    @VendorProfileID INT,
    @DayOfWeek TINYINT,
    @OpenTime TIME = NULL,
    @CloseTime TIME = NULL,
    @IsAvailable BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorBusinessHours (VendorProfileID, DayOfWeek, OpenTime, CloseTime, IsAvailable)
    VALUES (@VendorProfileID, @DayOfWeek, @OpenTime, @CloseTime, @IsAvailable);
    
    SELECT SCOPE_IDENTITY() AS BusinessHourID;
END
GO
