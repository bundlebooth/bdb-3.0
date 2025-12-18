/*
    Migration Script: Create Stored Procedure [vendors.sp_UpsertService]
    Phase: 600 - Stored Procedures
    Script: cu_600_119_sp_UpsertVendorService.sql
    Description: Creates the [vendors].[sp_UpsertService] stored procedure
    Schema: vendors
    Execution Order: 119
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_UpsertService]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpsertService]'))
    DROP PROCEDURE [vendors].[sp_UpsertService];
GO

CREATE PROCEDURE [vendors].[sp_UpsertService]
    @ServiceID INT = NULL,
    @VendorProfileID INT,
    @CategoryID INT = NULL,
    @CategoryName NVARCHAR(100) = NULL, -- For backward compatibility
    @Name NVARCHAR(255) = NULL,
    @ServiceName NVARCHAR(100) = NULL, -- For backward compatibility
    @Description NVARCHAR(MAX) = NULL,
    @ServiceDescription NVARCHAR(MAX) = NULL, -- For backward compatibility
    -- legacy/compat fields
    @Price DECIMAL(10,2) = NULL,
    @DurationMinutes INT = NULL,
    @MaxAttendees INT = NULL,
    @IsActive BIT = 1,
    @RequiresDeposit BIT = 1,
    @DepositPercentage DECIMAL(5,2) = 20.00,
    @CancellationPolicy NVARCHAR(MAX) = NULL,
    @LinkedPredefinedServiceID INT = NULL,
    -- unified pricing
    @PricingModel NVARCHAR(20) = NULL, -- 'time_based' | 'fixed_based'
    @BaseDurationMinutes INT = NULL,
    @BaseRate DECIMAL(10,2) = NULL,
    @OvertimeRatePerHour DECIMAL(10,2) = NULL,
    @MinimumBookingFee DECIMAL(10,2) = NULL,
    @FixedPricingType NVARCHAR(20) = NULL, -- 'fixed_price' | 'per_attendee'
    @FixedPrice DECIMAL(10,2) = NULL,
    @PricePerPerson DECIMAL(10,2) = NULL,
    @MinimumAttendees INT = NULL,
    @MaximumAttendees INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Handle backward compatibility for parameter names
    IF @Name IS NULL SET @Name = @ServiceName;
    IF @Description IS NULL SET @Description = @ServiceDescription;

    -- Normalize pricing based on model: clear non-applicable fields
    DECLARE 
        @NormPricingModel NVARCHAR(20) = @PricingModel,
        @NormBaseDurationMinutes INT = NULL,
        @NormBaseRate DECIMAL(10,2) = NULL,
        @NormOvertimeRatePerHour DECIMAL(10,2) = NULL,
        @NormMinimumBookingFee DECIMAL(10,2) = NULL,
        @NormFixedPricingType NVARCHAR(20) = NULL,
        @NormFixedPrice DECIMAL(10,2) = NULL,
        @NormPricePerPerson DECIMAL(10,2) = NULL,
        @NormMinimumAttendees INT = NULL,
        @NormMaximumAttendees INT = NULL;

    IF @NormPricingModel = 'time_based'
    BEGIN
        SET @NormBaseDurationMinutes = @BaseDurationMinutes;
        SET @NormBaseRate = @BaseRate;
        SET @NormOvertimeRatePerHour = @OvertimeRatePerHour;
        SET @NormMinimumBookingFee = @MinimumBookingFee;
        -- clear fixed-based
        SET @NormFixedPricingType = NULL;
        SET @NormFixedPrice = NULL;
        SET @NormPricePerPerson = NULL;
        SET @NormMinimumAttendees = NULL;
        SET @NormMaximumAttendees = NULL;
    END
    ELSE IF @NormPricingModel = 'fixed_based'
    BEGIN
        SET @NormFixedPricingType = @FixedPricingType;
        IF @FixedPricingType = 'fixed_price'
        BEGIN
            SET @NormFixedPrice = @FixedPrice;
            SET @NormPricePerPerson = NULL;
            SET @NormMinimumAttendees = NULL;
            SET @NormMaximumAttendees = NULL;
        END
        ELSE IF @FixedPricingType = 'per_attendee'
        BEGIN
            SET @NormPricePerPerson = @PricePerPerson;
            SET @NormMinimumAttendees = @MinimumAttendees;
            SET @NormMaximumAttendees = @MaximumAttendees;
            SET @NormFixedPrice = NULL;
        END
        -- clear time-based
        SET @NormBaseDurationMinutes = NULL;
        SET @NormBaseRate = NULL;
        SET @NormOvertimeRatePerHour = NULL;
        SET @NormMinimumBookingFee = NULL;
    END

    -- Resolve CategoryID from CategoryName if needed (backward compatibility)
    IF @CategoryID IS NULL AND @CategoryName IS NOT NULL
    BEGIN
        SELECT @CategoryID = CategoryID
        FROM vendors.ServiceCategories
        WHERE VendorProfileID = @VendorProfileID AND Name = @CategoryName;

        IF @CategoryID IS NULL
        BEGIN
            INSERT INTO ServiceCategories (VendorProfileID, Name, Description)
            VALUES (@VendorProfileID, @CategoryName, @CategoryName + ' services');
            SET @CategoryID = SCOPE_IDENTITY();
        END
    END

    -- Compute compatibility Price if not provided
    IF @Price IS NULL
    BEGIN
        SET @Price = COALESCE(@NormFixedPrice, @NormBaseRate, @NormPricePerPerson, @MinimumBookingFee, 0);
    END

    BEGIN TRY
        IF @ServiceID IS NULL -- Insert new service
        BEGIN
            INSERT INTO Services (
                VendorProfileID, CategoryID, Name, Description,
                Price, DurationMinutes, MaxAttendees, IsActive, RequiresDeposit, DepositPercentage, CancellationPolicy, LinkedPredefinedServiceID,
                PricingModel, BaseDurationMinutes, BaseRate, OvertimeRatePerHour, MinimumBookingFee,
                FixedPricingType, FixedPrice, PricePerPerson, MinimumAttendees, MaximumAttendees,
                CreatedAt
            ) VALUES (
                @VendorProfileID, @CategoryID, @Name, @Description,
                @Price, @DurationMinutes, @MaxAttendees, @IsActive, @RequiresDeposit, @DepositPercentage, @CancellationPolicy, @LinkedPredefinedServiceID,
                @NormPricingModel, @NormBaseDurationMinutes, @NormBaseRate, @NormOvertimeRatePerHour, @NormMinimumBookingFee,
                @NormFixedPricingType, @NormFixedPrice, @NormPricePerPerson, @NormMinimumAttendees, @NormMaximumAttendees,
                GETDATE()
            );
            
            SELECT SCOPE_IDENTITY() AS ServiceID;
        END
        ELSE -- Update existing service
        BEGIN
            UPDATE Services
            SET
                CategoryID = @CategoryID,
                Name = @Name,
                Description = @Description,
                Price = @Price,
                DurationMinutes = @DurationMinutes,
                MaxAttendees = @MaxAttendees,
                IsActive = @IsActive,
                RequiresDeposit = @RequiresDeposit,
                DepositPercentage = @DepositPercentage,
                CancellationPolicy = @CancellationPolicy,
                LinkedPredefinedServiceID = @LinkedPredefinedServiceID,
                PricingModel = @NormPricingModel,
                BaseDurationMinutes = @NormBaseDurationMinutes,
                BaseRate = @NormBaseRate,
                OvertimeRatePerHour = @NormOvertimeRatePerHour,
                MinimumBookingFee = @NormMinimumBookingFee,
                FixedPricingType = @NormFixedPricingType,
                FixedPrice = @NormFixedPrice,
                PricePerPerson = @NormPricePerPerson,
                MinimumAttendees = @NormMinimumAttendees,
                MaximumAttendees = @NormMaximumAttendees,
                UpdatedAt = GETDATE()
            WHERE ServiceID = @ServiceID;
            
            SELECT @ServiceID AS ServiceID;
        END
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;
GO

PRINT 'Stored procedure [vendors].[sp_UpsertService] created successfully.';
GO
