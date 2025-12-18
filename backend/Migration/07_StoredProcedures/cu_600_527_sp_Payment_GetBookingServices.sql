-- =============================================
-- Stored Procedure: sp_Payment_GetBookingServices
-- Description: Gets booking services with pricing
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Payment_GetBookingServices]'))
    DROP PROCEDURE [dbo].[sp_Payment_GetBookingServices];
GO

CREATE PROCEDURE [dbo].[sp_Payment_GetBookingServices]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT Quantity, PriceAtBooking FROM BookingServices WHERE BookingID = @BookingID;
END
GO
