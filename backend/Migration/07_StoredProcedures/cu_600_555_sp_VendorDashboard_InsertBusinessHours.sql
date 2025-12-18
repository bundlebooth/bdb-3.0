-- =============================================
-- Stored Procedure: sp_VendorDashboard_InsertBusinessHours
-- Description: Inserts new business hours
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_InsertBusinessHours]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_InsertBusinessHours];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_InsertBusinessHours]
    @VendorProfileID INT,
    @DayOfWeek TINYINT,
    @OpenTime VARCHAR(8),
    @CloseTime VARCHAR(8),
    @IsAvailable BIT,
    @Timezone NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorBusinessHours (VendorProfileID, DayOfWeek, OpenTime, CloseTime, IsAvailable, Timezone, CreatedAt, UpdatedAt)
    OUTPUT INSERTED.HoursID
    VALUES (@VendorProfileID, @DayOfWeek, @OpenTime, @CloseTime, @IsAvailable, @Timezone, GETUTCDATE(), GETUTCDATE());
END
GO
