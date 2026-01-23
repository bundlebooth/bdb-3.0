/*
    Migration Script: Create Stored Procedure [vendors].[sp_GetUnifiedBookings]
    Description: Gets all bookings for a vendor with optional status filter
    
    Execution Order: 705
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetUnifiedBookings]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetUnifiedBookings]'))
    DROP PROCEDURE [vendors].[sp_GetUnifiedBookings];
GO

CREATE PROCEDURE [vendors].[sp_GetUnifiedBookings]
    @VendorProfileID INT,
    @StatusFilter NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        BookingID, RequestID, UserID, VendorProfileID, ServiceID,
        BookingDate, EventDate, EndDate, EventTime, EventEndTime,
        UnifiedStatus AS Status, OriginalStatus,
        TotalAmount, Budget, DepositAmount, DepositPaid, FullAmountPaid,
        AttendeeCount, SpecialRequests, Services,
        ResponseMessage, ProposedPrice, ExpiresAt, RespondedAt, ConfirmedAt,
        CancellationDate, CancelledAt, CancellationReason, CancelledBy,
        DeclinedReason, ExpiredAt, RefundAmount,
        StripePaymentIntentID, CreatedAt, UpdatedAt,
        EventLocation, EventLocation AS Location,
        EventName, EventType, TimeZone, GroupID,
        ClientName, ClientEmail, ClientPhone, ClientPublicId,
        VendorName, VendorEmail, VendorPhone, VendorLogo, VendorPublicId,
        ServiceName, ServiceCategory, ConversationID,
        StatusLabel, StatusCategory
    FROM bookings.vw_UnifiedBookings
    WHERE VendorProfileID = @VendorProfileID
      AND (@StatusFilter IS NULL OR StatusCategory = @StatusFilter)
    ORDER BY 
        CASE WHEN UnifiedStatus = 'pending' THEN 0 ELSE 1 END,
        EventDate DESC;
END;
GO

PRINT 'Stored procedure [vendors].[sp_GetUnifiedBookings] created successfully.';
GO
