
-- Complete vendor setup with all features
CREATE   PROCEDURE sp_CompleteVendorSetup
    @VendorProfileID INT,
    @GalleryData NVARCHAR(MAX) = NULL,
    @PackagesData NVARCHAR(MAX) = NULL,
    @ServicesData NVARCHAR(MAX) = NULL,
    @SocialMediaData NVARCHAR(MAX) = NULL,
    @AvailabilityData NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Save gallery images using VendorImages table
        IF @GalleryData IS NOT NULL
        BEGIN
            -- Clear existing non-primary images
            DELETE FROM VendorImages WHERE VendorProfileID = @VendorProfileID AND IsPrimary = 0;
            
            -- Insert new gallery items
            INSERT INTO VendorImages (VendorProfileID, ImageURL, ImageType, IsPrimary, DisplayOrder, Caption)
            SELECT 
                @VendorProfileID,
                JSON_VALUE(value, '$.url'),
                JSON_VALUE(value, '$.type'),
                CASE WHEN ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) = 1 THEN 1 ELSE 0 END,
                ROW_NUMBER() OVER (ORDER BY (SELECT NULL)),
                JSON_VALUE(value, '$.caption')
            FROM OPENJSON(@GalleryData);
            
            -- Mark gallery as completed
            UPDATE VendorProfiles SET GalleryCompleted = 1 WHERE VendorProfileID = @VendorProfileID;
        END
        
        -- Save packages using Services table with a "Packages" category
        IF @PackagesData IS NOT NULL
        BEGIN
            -- Get or create a "Packages" service category
            DECLARE @PackageCategoryID INT;
            SELECT @PackageCategoryID = CategoryID 
            FROM ServiceCategories 
            WHERE VendorProfileID = @VendorProfileID AND Name = 'Packages';
            
            IF @PackageCategoryID IS NULL
            BEGIN
                INSERT INTO ServiceCategories (VendorProfileID, Name, Description)
                VALUES (@VendorProfileID, 'Packages', 'Service packages offered');
                SET @PackageCategoryID = SCOPE_IDENTITY();
            END
            
            -- Clear existing packages
            DELETE FROM Services WHERE CategoryID = @PackageCategoryID;
            
            -- Insert new packages as services
            INSERT INTO Services (CategoryID, Name, Description, Price, DurationMinutes, MaxAttendees, ServiceType)
            SELECT 
                @PackageCategoryID,
                JSON_VALUE(value, '$.name'),
                JSON_VALUE(value, '$.description'),
                CAST(JSON_VALUE(value, '$.price') AS DECIMAL(10,2)),
                CASE 
                    WHEN JSON_VALUE(value, '$.duration') LIKE '%hour%' 
                    THEN CAST(SUBSTRING(JSON_VALUE(value, '$.duration'), 1, CHARINDEX(' ', JSON_VALUE(value, '$.duration')) - 1) AS INT) * 60
                    ELSE 60
                END,
                CAST(JSON_VALUE(value, '$.maxGuests') AS INT),
                'Package'
            FROM OPENJSON(@PackagesData);
            
            -- Mark packages as completed
            UPDATE VendorProfiles SET PackagesCompleted = 1 WHERE VendorProfileID = @VendorProfileID;
        END
        
        -- Save services using Services table with "General Services" category
        IF @ServicesData IS NOT NULL
        BEGIN
            -- Get or create a "General Services" category
            DECLARE @ServicesCategoryID INT;
            SELECT @ServicesCategoryID = CategoryID 
            FROM ServiceCategories 
            WHERE VendorProfileID = @VendorProfileID AND Name = 'General Services';
            
            IF @ServicesCategoryID IS NULL
            BEGIN
                INSERT INTO ServiceCategories (VendorProfileID, Name, Description)
                VALUES (@VendorProfileID, 'General Services', 'General services offered');
                SET @ServicesCategoryID = SCOPE_IDENTITY();
            END
            
            -- Insert services
            INSERT INTO Services (CategoryID, Name, Description, Price, DurationMinutes, ServiceType)
            SELECT 
                @ServicesCategoryID,
                JSON_VALUE(value, '$.name'),
                JSON_VALUE(value, '$.description'),
                CAST(JSON_VALUE(value, '$.price') AS DECIMAL(10,2)),
                CASE 
                    WHEN JSON_VALUE(value, '$.duration') LIKE '%hour%' 
                    THEN CAST(SUBSTRING(JSON_VALUE(value, '$.duration'), 1, CHARINDEX(' ', JSON_VALUE(value, '$.duration')) - 1) AS INT) * 60
                    ELSE 60
                END,
                'Service'
            FROM OPENJSON(@ServicesData);
            
            -- Mark services as completed
            UPDATE VendorProfiles SET ServicesCompleted = 1 WHERE VendorProfileID = @VendorProfileID;
        END
        
        -- Save social media using VendorSocialMedia table
        IF @SocialMediaData IS NOT NULL
        BEGIN
            -- Clear existing social media
            DELETE FROM VendorSocialMedia WHERE VendorProfileID = @VendorProfileID;
            
            -- Insert new social media links
            INSERT INTO VendorSocialMedia (VendorProfileID, Platform, URL, DisplayOrder)
            SELECT 
                @VendorProfileID,
                [key],
                [value],
                ROW_NUMBER() OVER (ORDER BY [key])
            FROM OPENJSON(@SocialMediaData)
            WHERE [value] IS NOT NULL AND [value] != '';
            
            -- Mark social media as completed
            UPDATE VendorProfiles SET SocialMediaCompleted = 1 WHERE VendorProfileID = @VendorProfileID;
        END
        
        -- Save availability using VendorBusinessHours table
        IF @AvailabilityData IS NOT NULL
        BEGIN
            -- Clear existing availability
            DELETE FROM VendorBusinessHours WHERE VendorProfileID = @VendorProfileID;
            
            -- Insert new availability
            INSERT INTO VendorBusinessHours (VendorProfileID, DayOfWeek, OpenTime, CloseTime, IsAvailable)
            SELECT 
                @VendorProfileID,
                CAST(JSON_VALUE(value, '$.day') AS TINYINT),
                CAST(JSON_VALUE(value, '$.start') AS TIME),
                CAST(JSON_VALUE(value, '$.end') AS TIME),
                1
            FROM OPENJSON(@AvailabilityData);
            
            -- Mark availability as completed
            UPDATE VendorProfiles SET AvailabilityCompleted = 1 WHERE VendorProfileID = @VendorProfileID;
        END
        
        -- Update vendor setup completion status
        UPDATE VendorProfiles 
        SET 
            SetupCompleted = CASE 
                WHEN GalleryCompleted = 1 AND PackagesCompleted = 1 AND ServicesCompleted = 1 
                     AND SocialMediaCompleted = 1 AND AvailabilityCompleted = 1 
                THEN 1 ELSE 0 
            END,
            SetupStep = 4,
            IsVerified = 1, -- Mark as verified when setup is complete
            UpdatedAt = GETDATE()
        WHERE VendorProfileID = @VendorProfileID;
        
        COMMIT TRANSACTION;
        
        SELECT 1 AS Success, 'Vendor setup completed successfully' AS Message;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        
        SELECT 0 AS Success, ERROR_MESSAGE() AS Message;
    END CATCH
END;

GO

