
-- NEW: Add/Update Vendor Service
CREATE   PROCEDURE sp_UpsertVendorService
    @ServiceID INT = NULL, -- NULL for new service, ID for update
    @VendorProfileID INT,
    @CategoryName NVARCHAR(100),
    @ServiceName NVARCHAR(100),
    @ServiceDescription NVARCHAR(MAX),
    @Price DECIMAL(10, 2),
    @DurationMinutes INT = NULL,
    @MaxAttendees INT = NULL,
    @IsActive BIT = 1,
    @RequiresDeposit BIT = 1,
    @DepositPercentage DECIMAL(5,2) = 20.00,
    @CancellationPolicy NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CategoryID INT;

    -- Find or create ServiceCategory
    SELECT @CategoryID = CategoryID
    FROM ServiceCategories
    WHERE VendorProfileID = @VendorProfileID AND Name = @CategoryName;

    IF @CategoryID IS NULL
    BEGIN
        INSERT INTO ServiceCategories (VendorProfileID, Name, Description)
        VALUES (@VendorProfileID, @CategoryName, @CategoryName + ' services');
        SET @CategoryID = SCOPE_IDENTITY();
    END

    IF @ServiceID IS NULL -- Insert new service
    BEGIN
        INSERT INTO Services (
            CategoryID,
            Name,
            Description,
            Price,
            DurationMinutes,
            MaxAttendees,
            IsActive,
            RequiresDeposit,
            DepositPercentage,
            CancellationPolicy
        )
        VALUES (
            @CategoryID,
            @ServiceName,
            @ServiceDescription,
            @Price,
            @DurationMinutes,
            @MaxAttendees,
            @IsActive,
            @RequiresDeposit,
            @DepositPercentage,
            @CancellationPolicy
        );
        SELECT SCOPE_IDENTITY() AS ServiceID;
    END
    ELSE -- Update existing service
    BEGIN
        UPDATE Services
        SET
            CategoryID = @CategoryID,
            Name = @ServiceName,
            Description = @ServiceDescription,
            Price = @Price,
            DurationMinutes = @DurationMinutes,
            MaxAttendees = @MaxAttendees,
            IsActive = @IsActive,
            RequiresDeposit = @RequiresDeposit,
            DepositPercentage = @DepositPercentage,
            CancellationPolicy = @CancellationPolicy,
            UpdatedAt = GETDATE()
        WHERE ServiceID = @ServiceID;
        SELECT @ServiceID AS ServiceID;
    END
END;
GO
 
-- =============================================
-- TRIGGERS
-- =============================================
 
-- =============================================
-- DATABASE DDL GENERATION COMPLETE
-- =============================================
