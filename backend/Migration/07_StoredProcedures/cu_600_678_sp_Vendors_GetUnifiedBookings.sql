/*
    Migration Script: Create Stored Procedure [vendors].[sp_GetUnifiedBookings]
    Phase: 600 - Stored Procedures
    Script: cu_600_678_sp_Vendors_GetUnifiedBookings.sql
    Description: Gets all bookings and requests for a vendor using the unified view
                 Returns data with consistent status values for frontend display
    
    Execution Order: 678
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetUnifiedBookings]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetUnifiedBookings]'))
    DROP PROCEDURE [vendors].[sp_GetUnifiedBookings];
GO

CREATE PROCEDURE [vendors].[sp_GetUnifiedBookings]
    @VendorProfileID INT,
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
        ClientPublicId,
        VendorName,
        VendorEmail,
        VendorPhone,
        VendorLogo,
        ServiceName,
        ServiceCategory,
        ConversationID,
        StatusLabel,
        StatusCategory
    FROM bookings.vw_UnifiedBookings
    WHERE VendorProfileID = @VendorProfileID
      AND (@StatusFilter IS NULL OR StatusCategory = @StatusFilter)
    ORDER BY 
        -- Pending items first (vendor needs to respond), then by event date
        CASE WHEN UnifiedStatus = 'pending' THEN 0 ELSE 1 END,
        EventDate DESC;
END;
GO

PRINT 'Stored procedure [vendors].[sp_GetUnifiedBookings] created successfully.';
GO
