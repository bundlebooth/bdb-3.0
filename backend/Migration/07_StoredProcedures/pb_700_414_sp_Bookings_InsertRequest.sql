/*
    Migration Script: Create Stored Procedure [bookings].[sp_InsertRequest]
    Description: Creates a new booking request in the unified Bookings table
    
    Execution Order: 700
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [bookings].[sp_InsertRequest]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_InsertRequest]'))
    DROP PROCEDURE [bookings].[sp_InsertRequest];
GO

CREATE PROCEDURE [bookings].[sp_InsertRequest]
    @UserID INT,
    @VendorProfileID INT,
    @Services NVARCHAR(MAX),
    @EventDate VARCHAR(10),
    @EventTime VARCHAR(8),
    @EventEndTime VARCHAR(8),
    @EventLocation NVARCHAR(500),
    @AttendeeCount INT,
    @Budget DECIMAL(10,2),
    @SpecialRequests NVARCHAR(MAX),
    @EventName NVARCHAR(255),
    @EventType NVARCHAR(100),
    @TimeZone NVARCHAR(100),
    @Status NVARCHAR(50) = 'pending',
    @ExpiresAt DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate ALL required fields - no defaults allowed
    IF @UserID IS NULL
    BEGIN
        RAISERROR('User ID is required', 16, 1);
        RETURN;
    END

    IF @VendorProfileID IS NULL
    BEGIN
        RAISERROR('Vendor Profile ID is required', 16, 1);
        RETURN;
    END

    IF @EventDate IS NULL OR LTRIM(RTRIM(@EventDate)) = ''
    BEGIN
        RAISERROR('Event date is required', 16, 1);
        RETURN;
    END

    IF @EventTime IS NULL OR LTRIM(RTRIM(@EventTime)) = ''
    BEGIN
        RAISERROR('Event time is required', 16, 1);
        RETURN;
    END

    IF @EventName IS NULL OR LTRIM(RTRIM(@EventName)) = ''
    BEGIN
        RAISERROR('Event name is required', 16, 1);
        RETURN;
    END

    IF @EventType IS NULL OR LTRIM(RTRIM(@EventType)) = ''
    BEGIN
        RAISERROR('Event type is required', 16, 1);
        RETURN;
    END

    IF @EventLocation IS NULL OR LTRIM(RTRIM(@EventLocation)) = ''
    BEGIN
        RAISERROR('Event location is required', 16, 1);
        RETURN;
    END

    IF @TimeZone IS NULL OR LTRIM(RTRIM(@TimeZone)) = ''
    BEGIN
        RAISERROR('Time zone is required', 16, 1);
        RETURN;
    END

    IF @AttendeeCount IS NULL OR @AttendeeCount < 1
    BEGIN
        RAISERROR('Attendee count must be at least 1', 16, 1);
        RETURN;
    END

    IF @Services IS NULL OR LTRIM(RTRIM(@Services)) = ''
    BEGIN
        RAISERROR('Services selection is required', 16, 1);
        RETURN;
    END

    DECLARE @BookingID INT;

    -- Insert into unified Bookings table - all values required, no defaults
    INSERT INTO bookings.Bookings (
        UserID, VendorProfileID, ServiceID,
        BookingDate, EventDate, EventTime, EventEndTime,
        EventLocation, EventName, EventType, TimeZone,
        AttendeeCount, Budget, TotalAmount, Services, SpecialRequests,
        Status, ExpiresAt, GroupID, CreatedAt, UpdatedAt
    )
    VALUES (
        @UserID, @VendorProfileID, NULL,
        GETDATE(),
        TRY_CAST(@EventDate AS DATE),
        TRY_CAST(@EventTime AS TIME),
        TRY_CAST(@EventEndTime AS TIME),
        @EventLocation,
        @EventName,
        @EventType,
        @TimeZone,
        @AttendeeCount,
        @Budget,
        @Budget,
        @Services,
        @SpecialRequests,
        @Status,
        @ExpiresAt,
        '',
        GETDATE(),
        GETDATE()
    );

    SET @BookingID = SCOPE_IDENTITY();

    -- Add to timeline
    INSERT INTO bookings.BookingTimeline (BookingID, Status, ChangedBy, Notes, CreatedAt)
    VALUES (@BookingID, 'pending', @UserID, 'Booking request created', GETDATE());

    -- Return the new booking ID
    SELECT @BookingID AS RequestID, GETDATE() AS CreatedAt, @ExpiresAt AS ExpiresAt;
END;
GO

PRINT 'Stored procedure [bookings].[sp_InsertRequest] created successfully.';
GO
