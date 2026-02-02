-- =============================================
-- Stored Procedure: admin.sp_GetTransactions
-- Description: Gets all payment transactions for admin panel
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
    
    -- Main query
    SELECT 
        t.TransactionID,
        t.BookingID,
        t.Amount,
        t.FeeAmount,
        t.NetAmount,
        t.Currency,
        t.Status,
        CASE 
            WHEN t.Amount > 0 THEN 'Payment'
            WHEN t.Amount < 0 THEN 'Refund'
            ELSE 'Adjustment'
        END as Type,
        t.Description,
        t.StripeChargeID,
        t.CreatedAt,
        b.EventName,
        CONCAT(u.FirstName, ' ', ISNULL(u.LastName, '')) as ClientName,
        u.Email as ClientEmail,
        vp.BusinessName as VendorName
    FROM payments.Transactions t
    LEFT JOIN bookings.Bookings b ON t.BookingID = b.BookingID
    LEFT JOIN users.Users u ON b.UserID = u.UserID
    LEFT JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE 
        (@Filter IS NULL OR t.Status = @Filter)
    ORDER BY t.CreatedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
    
    -- Count query
    SELECT COUNT(*) as total
    FROM payments.Transactions t
    WHERE (@Filter IS NULL OR t.Status = @Filter);
END
GO
