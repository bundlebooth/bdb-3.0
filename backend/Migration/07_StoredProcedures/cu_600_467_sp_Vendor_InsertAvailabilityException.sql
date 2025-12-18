-- =============================================
-- Stored Procedure: sp_Vendor_InsertAvailabilityException
-- Description: Inserts an availability exception for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_InsertAvailabilityException]'))
    DROP PROCEDURE [dbo].[sp_Vendor_InsertAvailabilityException];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_InsertAvailabilityException]
    @VendorProfileID INT,
    @Date DATE,
    @StartTime TIME = NULL,
    @EndTime TIME = NULL,
    @IsAvailable BIT,
    @Reason NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorAvailabilityExceptions (VendorProfileID, Date, StartTime, EndTime, IsAvailable, Reason)
    VALUES (@VendorProfileID, @Date, @StartTime, @EndTime, @IsAvailable, @Reason);
    
    SELECT SCOPE_IDENTITY() AS ExceptionID;
END
GO
