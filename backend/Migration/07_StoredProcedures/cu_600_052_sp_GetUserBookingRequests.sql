/*
    Migration Script: Create Stored Procedure [sp_GetUserBookingRequests]
    Phase: 600 - Stored Procedures
    Script: cu_600_052_dbo.sp_GetUserBookingRequests.sql
    Description: Creates the [users].[sp_GetBookingRequests] stored procedure
    
    Execution Order: 52
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [users].[sp_GetBookingRequests]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetBookingRequests]'))
    DROP PROCEDURE [users].[sp_GetBookingRequests];
GO

CREATE   PROCEDURE [users].[sp_GetBookingRequests]
    @UserID INT,
    @Status NVARCHAR(50) = NULL,
    @PageSize INT = 20,
    @PageNumber INT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    SELECT 
        br.RequestID,
        br.VendorProfileID,
        vp.BusinessName AS VendorName,
        vp.LogoURL AS VendorImage,
        br.ServiceID,
        s.Name AS ServiceName,
        br.EventDate,
        br.EventTime,
        br.EventLocation,
        br.AttendeeCount,
        br.Budget,
        br.SpecialRequests,
        br.Status,
        br.ProposedPrice,
        br.ResponseMessage,
        br.CreatedAt,
        br.ExpiresAt,
        br.RespondedAt,
        CASE 
            WHEN br.ExpiresAt < GETDATE() AND br.Status = 'pending' THEN 1
            ELSE 0
        END AS IsExpired,
        (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) 
         FROM vendors.Reviews r 
         WHERE r.VendorProfileID = br.VendorProfileID AND r.IsApproved = 1) AS VendorRating,
        (SELECT COUNT(*) 
         FROM vendors.Reviews r 
         WHERE r.VendorProfileID = br.VendorProfileID AND r.IsApproved = 1) AS VendorReviewCount
    FROM bookings.BookingRequests br
    JOIN vendors.VendorProfiles vp ON br.VendorProfileID = vp.VendorProfileID
    LEFT JOIN vendors.Services s ON br.ServiceID = s.ServiceID
    WHERE br.UserID = @UserID
        AND (@Status IS NULL OR br.Status = @Status)
    ORDER BY br.CreatedAt DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;

GO

PRINT 'Stored procedure [users].[sp_GetBookingRequests] created successfully.';
GO



