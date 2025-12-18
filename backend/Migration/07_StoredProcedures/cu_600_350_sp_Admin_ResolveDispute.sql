-- =============================================
-- Stored Procedure: sp_Admin_ResolveDispute
-- Description: Resolves a booking dispute
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_ResolveDispute]'))
    DROP PROCEDURE [dbo].[sp_Admin_ResolveDispute];
GO

CREATE PROCEDURE [dbo].[sp_Admin_ResolveDispute]
    @BookingID INT,
    @Status NVARCHAR(50),
    @RefundAmount DECIMAL(10,2) = NULL,
    @Resolution NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Bookings 
    SET Status = @Status,
        RefundAmount = @RefundAmount,
        SpecialRequests = CASE WHEN @Resolution IS NOT NULL THEN ISNULL(SpecialRequests, '') + ' [Resolution: ' + @Resolution + ']' ELSE SpecialRequests END,
        UpdatedAt = GETDATE()
    WHERE BookingID = @BookingID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
