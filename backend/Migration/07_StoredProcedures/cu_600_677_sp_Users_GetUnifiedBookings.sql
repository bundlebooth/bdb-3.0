/*
    Migration Script: Create Stored Procedure [users].[sp_GetUnifiedBookings]
    Phase: 600 - Stored Procedures
    Script: cu_600_677_sp_Users_GetUnifiedBookings.sql
    Description: Gets all bookings and requests for a user using the unified view
                 Returns data with consistent status values for frontend display
    
    Execution Order: 677
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [users].[sp_GetUnifiedBookings]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetUnifiedBookings]'))
    DROP PROCEDURE [users].[sp_GetUnifiedBookings];
GO

CREATE PROCEDURE [users].[sp_GetUnifiedBookings]
    @UserID INT,
    @StatusFilter NVARCHAR(50) = NULL -- Optional: 'pending', 'upcoming', 'completed', 'cancelled', 'declined'
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        BookingID,
        RequestID,
        UserID,
        VendorProfileID,
        ServiceID,
        BookingDate,
        EventDate,
        EndDate,
        UnifiedStatus AS Status,
        OriginalStatus,
        TotalAmount,
        DepositAmount,
        DepositPaid,
        FullAmountPaid,
        AttendeeCount,
        SpecialRequests,
        CancellationDate,
        RefundAmount,
        StripePaymentIntentID,
        CreatedAt,
        UpdatedAt,
        EventLocation,
        EventLocation AS Location,
        EventName,
        EventType,
        TimeZone,
        EventTime,
        EventEndTime,
        ExpiresAt,
        ResponseMessage,
        DeclineReason,
        RecordType,
        ClientName,
        ClientEmail,
        ClientPhone,
        VendorName,
        VendorEmail,
        VendorPhone,
        VendorLogo,
        VendorPublicId,
        ServiceName,
        ServiceCategory,
        ConversationID,
        StatusLabel,
        StatusCategory
    FROM bookings.vw_UnifiedBookings
    WHERE UserID = @UserID
      AND (@StatusFilter IS NULL OR StatusCategory = @StatusFilter)
    ORDER BY 
        -- Pending items first, then by event date
        CASE WHEN UnifiedStatus = 'pending' THEN 0 ELSE 1 END,
        EventDate DESC;
END;
GO

PRINT 'Stored procedure [users].[sp_GetUnifiedBookings] created successfully.';
GO
