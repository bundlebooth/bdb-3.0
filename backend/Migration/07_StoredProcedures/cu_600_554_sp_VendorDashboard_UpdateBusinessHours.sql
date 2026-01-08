-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_UpdateBusinessHours
-- Description: Updates existing business hours
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_UpdateBusinessHours]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_UpdateBusinessHours];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_UpdateBusinessHours]
    @HoursID INT,
    @VendorProfileID INT,
    @OpenTime VARCHAR(8),
    @CloseTime VARCHAR(8),
    @IsAvailable BIT,
    @Timezone NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorBusinessHours
    SET OpenTime = @OpenTime, CloseTime = @CloseTime, IsAvailable = @IsAvailable, 
        Timezone = @Timezone, UpdatedAt = GETUTCDATE()
    WHERE HoursID = @HoursID AND VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

