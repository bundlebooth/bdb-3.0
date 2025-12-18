-- =============================================
-- Stored Procedure: admin.sp_GetAllBookings
-- Description: Gets all bookings with filters for admin panel
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetAllBookings]'))
    DROP PROCEDURE [admin].[sp_GetAllBookings];
GO

CREATE PROCEDURE [admin].[sp_GetAllBookings]
    @Status NVARCHAR(50) = NULL,
    @Search NVARCHAR(100) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    -- Main query
    SELECT 
        b.BookingID,
        b.UserID,
        b.VendorProfileID,
        b.EventDate,
        b.EndDate,
        b.Status,
        b.TotalAmount,
        b.DepositAmount,
        b.DepositPaid,
        b.FullAmountPaid,
        b.AttendeeCount,
        b.SpecialRequests,
        b.EventLocation,
        b.EventName,
        b.EventType,
        b.CreatedAt,
        b.UpdatedAt,
        u.Name as ClientName,
        u.Email as ClientEmail,
        vp.BusinessName as VendorName
    FROM bookings.Bookings b
    LEFT JOIN users.Users u ON b.UserID = u.UserID
    LEFT JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE 
        (@Status IS NULL OR @Status = 'all' OR b.Status = @Status)
        AND (@Search IS NULL OR u.Name LIKE '%' + @Search + '%' OR u.Email LIKE '%' + @Search + '%' OR vp.BusinessName LIKE '%' + @Search + '%')
    ORDER BY b.CreatedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
    
    -- Count query
    SELECT COUNT(*) as total
    FROM bookings.Bookings b
    LEFT JOIN users.Users u ON b.UserID = u.UserID
    LEFT JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE 
        (@Status IS NULL OR @Status = 'all' OR b.Status = @Status)
        AND (@Search IS NULL OR u.Name LIKE '%' + @Search + '%' OR u.Email LIKE '%' + @Search + '%' OR vp.BusinessName LIKE '%' + @Search + '%');
END
GO



