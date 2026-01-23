-- =============================================
-- Stored Procedure: admin.sp_GetTransactions
-- Description: Gets payment transactions with pagination
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetTransactions]'))
    DROP PROCEDURE [admin].[sp_GetTransactions];
GO

CREATE PROCEDURE [admin].[sp_GetTransactions]
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
        CONCAT(u.FirstName, ' ', ISNULL(u.LastName, '')) as ClientName,
        vp.BusinessName as VendorName,
        b.BookingID,
        b.TotalAmount as Amount,
        b.TotalAmount * 0.1 as PlatformFee,
        b.Status
    FROM bookings.Bookings b
    JOIN users.Users u ON b.UserID = u.UserID
    JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE (@Filter IS NULL OR b.Status = @Filter)
    ORDER BY b.CreatedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
    
    SELECT COUNT(*) as total FROM bookings.Bookings WHERE (@Filter IS NULL OR Status = @Filter);
END
GO



