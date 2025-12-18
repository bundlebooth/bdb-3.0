/*
    Migration Script: Create Stored Procedure [sp_GetVendorBookingRequests]
    Phase: 600 - Stored Procedures
    Script: cu_600_062_dbo.sp_GetVendorBookingRequests.sql
    Description: Creates the [vendors].[sp_GetBookingRequests] stored procedure
    
    Execution Order: 62
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetBookingRequests]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetBookingRequests]'))
    DROP PROCEDURE [vendors].[sp_GetBookingRequests];
GO

CREATE   PROCEDURE [vendors].[sp_GetBookingRequests]
    @VendorProfileID INT,
    @Status NVARCHAR(50) = NULL,
    @PageSize INT = 20,
    @PageNumber INT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    SELECT 
        br.RequestID,
        br.UserID,
        u.Name AS ClientName,
        u.Email AS ClientEmail,
        u.Phone AS ClientPhone,
        u.ProfileImageURL AS ClientAvatar,
        br.ServiceID,
        s.Name AS ServiceName,
        br.EventDate,
        br.EventTime,
        br.EventLocation,
        br.AttendeeCount,
        br.Budget,
        br.SpecialRequests,
        br.Services,
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
        DATEDIFF(HOUR, br.CreatedAt, GETDATE()) AS HoursOld
    FROM bookings.BookingRequests br
    JOIN users.Users u ON br.UserID = u.UserID
    LEFT JOIN vendors.Services s ON br.ServiceID = s.ServiceID
    WHERE br.VendorProfileID = @VendorProfileID
        AND (@Status IS NULL OR br.Status = @Status)
    ORDER BY 
        CASE WHEN br.Status = 'pending' THEN 1 ELSE 2 END,
        br.CreatedAt DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;

GO

PRINT 'Stored procedure [vendors].[sp_GetBookingRequests] created successfully.';
GO


