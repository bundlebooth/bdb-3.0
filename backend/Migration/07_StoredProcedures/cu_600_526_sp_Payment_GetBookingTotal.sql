-- =============================================
-- Stored Procedure: sp_Payment_GetBookingTotal
-- Description: Gets booking total amount
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Payment_GetBookingTotal]'))
    DROP PROCEDURE [dbo].[sp_Payment_GetBookingTotal];
GO

CREATE PROCEDURE [dbo].[sp_Payment_GetBookingTotal]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 TotalAmount FROM Bookings WHERE BookingID = @BookingID;
END
GO
