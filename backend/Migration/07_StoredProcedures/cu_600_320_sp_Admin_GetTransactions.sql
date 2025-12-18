-- =============================================
-- Stored Procedure: sp_Admin_GetTransactions
-- Description: Gets payment transactions with pagination
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetTransactions]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetTransactions];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetTransactions]
    @Filter NVARCHAR(50) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    SELECT 
        b.BookingID as TransactionID,
        b.CreatedAt,
        u.Name as ClientName,
        vp.BusinessName as VendorName,
        b.BookingID,
        b.TotalAmount as Amount,
        b.TotalAmount * 0.1 as PlatformFee,
        b.Status
    FROM Bookings b
    JOIN Users u ON b.UserID = u.UserID
    JOIN VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE (@Filter IS NULL OR b.Status = @Filter)
    ORDER BY b.CreatedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
    
    SELECT COUNT(*) as total FROM Bookings WHERE (@Filter IS NULL OR Status = @Filter);
END
GO
