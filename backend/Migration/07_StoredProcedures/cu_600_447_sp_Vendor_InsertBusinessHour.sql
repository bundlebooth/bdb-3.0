-- =============================================
-- Stored Procedure: sp_Vendor_InsertBusinessHour
-- Description: Inserts a business hour for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_InsertBusinessHour]'))
    DROP PROCEDURE [dbo].[sp_Vendor_InsertBusinessHour];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_InsertBusinessHour]
    @VendorProfileID INT,
    @DayOfWeek TINYINT,
    @OpenTime VARCHAR(8),
    @CloseTime VARCHAR(8),
    @IsAvailable BIT,
    @Timezone NVARCHAR(100) = 'America/Toronto'
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorBusinessHours (VendorProfileID, DayOfWeek, OpenTime, CloseTime, IsAvailable, Timezone)
    VALUES (@VendorProfileID, @DayOfWeek, @OpenTime, @CloseTime, @IsAvailable, @Timezone);
    
    SELECT SCOPE_IDENTITY() AS BusinessHourID;
END
GO
