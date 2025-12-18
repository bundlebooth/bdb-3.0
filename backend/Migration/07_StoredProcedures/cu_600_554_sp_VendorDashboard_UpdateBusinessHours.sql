-- =============================================
-- Stored Procedure: sp_VendorDashboard_UpdateBusinessHours
-- Description: Updates existing business hours
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_UpdateBusinessHours]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_UpdateBusinessHours];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_UpdateBusinessHours]
    @HoursID INT,
    @VendorProfileID INT,
    @OpenTime VARCHAR(8),
    @CloseTime VARCHAR(8),
    @IsAvailable BIT,
    @Timezone NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorBusinessHours
    SET OpenTime = @OpenTime, CloseTime = @CloseTime, IsAvailable = @IsAvailable, 
        Timezone = @Timezone, UpdatedAt = GETUTCDATE()
    WHERE HoursID = @HoursID AND VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
