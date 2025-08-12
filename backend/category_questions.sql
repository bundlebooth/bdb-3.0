-- ============================================
-- VenueVue Database Schema Updates
-- Category-Specific Questions & Enhanced Vendor Registration
-- Run this script to add the new tables and stored procedures
-- ============================================

-- 1. Create CategoryQuestions table for dynamic questions
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CategoryQuestions' AND xtype='U')
BEGIN
    CREATE TABLE CategoryQuestions (
        QuestionID INT IDENTITY(1,1) PRIMARY KEY,
        Category NVARCHAR(50) NOT NULL,
        QuestionText NVARCHAR(500) NOT NULL,
        QuestionType NVARCHAR(20) NOT NULL DEFAULT 'YesNo', -- YesNo, Text, Number, Select
        Options NVARCHAR(MAX) NULL, -- JSON array for select options
        IsRequired BIT NOT NULL DEFAULT 1,
        DisplayOrder INT NOT NULL DEFAULT 0,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Created CategoryQuestions table';
END
ELSE
BEGIN
    PRINT 'CategoryQuestions table already exists';
END
GO

-- 2. Create VendorAdditionalDetails table for category-specific answers
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='VendorAdditionalDetails' AND xtype='U')
BEGIN
    CREATE TABLE VendorAdditionalDetails (
        DetailID INT IDENTITY(1,1) PRIMARY KEY,
        VendorProfileID INT NOT NULL,
        QuestionID INT NOT NULL,
        Answer NVARCHAR(MAX) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (VendorProfileID) REFERENCES VendorProfiles(VendorProfileID) ON DELETE CASCADE,
        FOREIGN KEY (QuestionID) REFERENCES CategoryQuestions(QuestionID) ON DELETE CASCADE
    );
    PRINT 'Created VendorAdditionalDetails table';
END
ELSE
BEGIN
    PRINT 'VendorAdditionalDetails table already exists';
END
GO

-- 3. Add AdditionalCitiesServed column to VendorProfiles if it doesn't exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'VendorProfiles' AND COLUMN_NAME = 'AdditionalCitiesServed')
BEGIN
    ALTER TABLE VendorProfiles 
    ADD AdditionalCitiesServed NVARCHAR(MAX) NULL;
    PRINT 'Added AdditionalCitiesServed column to VendorProfiles';
END
ELSE
BEGIN
    PRINT 'AdditionalCitiesServed column already exists in VendorProfiles';
END
GO

-- 4. Insert category-specific questions
IF NOT EXISTS (SELECT * FROM CategoryQuestions WHERE Category = 'photo')
BEGIN
    INSERT INTO CategoryQuestions (Category, QuestionText, QuestionType, DisplayOrder) VALUES
    -- Photo / Video
    ('photo', 'Photography service?', 'YesNo', 1),
    ('photo', 'Videography service?', 'YesNo', 2),
    ('photo', 'Drone available?', 'YesNo', 3),
    ('photo', 'Editing included?', 'YesNo', 4),
    ('photo', 'Prints/albums provided?', 'YesNo', 5),
    ('photo', 'Backup equipment available?', 'YesNo', 6),
    ('photo', 'Travel outside city?', 'YesNo', 7),

    -- Venues
    ('venue', 'Indoor venue?', 'YesNo', 1),
    ('venue', 'Outdoor venue?', 'YesNo', 2),
    ('venue', 'Wheelchair accessible?', 'YesNo', 3),
    ('venue', 'On-site parking available?', 'YesNo', 4),
    ('venue', 'Catering available on-site?', 'YesNo', 5),
    ('venue', 'Alcohol service allowed?', 'YesNo', 6),
    ('venue', 'Sound restrictions?', 'YesNo', 7),
    ('venue', 'Décor restrictions?', 'YesNo', 8),
    ('venue', 'Tables/chairs included?', 'YesNo', 9),
    ('venue', 'AV equipment included?', 'YesNo', 10),

    -- Music / DJ
    ('music', 'DJ service available?', 'YesNo', 1),
    ('music', 'Live music available?', 'YesNo', 2),
    ('music', 'MC services provided?', 'YesNo', 3),
    ('music', 'Lighting included?', 'YesNo', 4),
    ('music', 'Guest song requests allowed?', 'YesNo', 5),
    ('music', 'Backup equipment available?', 'YesNo', 6),
    ('music', 'Travel outside city?', 'YesNo', 7),

    -- Catering
    ('catering', 'Buffet service?', 'YesNo', 1),
    ('catering', 'Plated service?', 'YesNo', 2),
    ('catering', 'Food stations available?', 'YesNo', 3),
    ('catering', 'Vegan options?', 'YesNo', 4),
    ('catering', 'Halal options?', 'YesNo', 5),
    ('catering', 'Gluten-free options?', 'YesNo', 6),
    ('catering', 'Alcohol service available?', 'YesNo', 7),
    ('catering', 'Staff included?', 'YesNo', 8),

    -- Entertainment
    ('entertainment', 'Family-friendly?', 'YesNo', 1),
    ('entertainment', 'Stage provided?', 'YesNo', 2),
    ('entertainment', 'Custom themes available?', 'YesNo', 3),
    ('entertainment', 'Audience interaction?', 'YesNo', 4),
    ('entertainment', 'Indoor performance possible?', 'YesNo', 5),
    ('entertainment', 'Outdoor performance possible?', 'YesNo', 6),

    -- Experiences
    ('experiences', 'Indoor setup possible?', 'YesNo', 1),
    ('experiences', 'Outdoor setup possible?', 'YesNo', 2),
    ('experiences', 'Branding/customization available?', 'YesNo', 3),
    ('experiences', 'Staff included?', 'YesNo', 4),
    ('experiences', 'Weather contingency?', 'YesNo', 5),
    ('experiences', 'Safety certification in place?', 'YesNo', 6),

    -- Decorations
    ('decor', 'Custom designs available?', 'YesNo', 1),
    ('decor', 'Setup included?', 'YesNo', 2),
    ('decor', 'Teardown included?', 'YesNo', 3),
    ('decor', 'Delivery available?', 'YesNo', 4),
    ('decor', 'Eco-friendly materials?', 'YesNo', 5),
    ('decor', 'Lighting included?', 'YesNo', 6),

    -- Beauty
    ('beauty', 'Mobile/on-location service?', 'YesNo', 1),
    ('beauty', 'Trial available?', 'YesNo', 2),
    ('beauty', 'Bridal styling offered?', 'YesNo', 3),
    ('beauty', 'Touch-up service available?', 'YesNo', 4),
    ('beauty', 'Vegan/cruelty-free products?', 'YesNo', 5),

    -- Cake
    ('cake', 'Custom designs?', 'YesNo', 1),
    ('cake', 'Vegan options?', 'YesNo', 2),
    ('cake', 'Gluten-free options?', 'YesNo', 3),
    ('cake', 'Delivery available?', 'YesNo', 4),
    ('cake', 'Stand included?', 'YesNo', 5),
    ('cake', 'Tasting available?', 'YesNo', 6),

    -- Transportation
    ('transport', 'Chauffeur included?', 'YesNo', 1),
    ('transport', 'Decor customization available?', 'YesNo', 2),
    ('transport', 'Alcohol allowed?', 'YesNo', 3),
    ('transport', 'Music system included?', 'YesNo', 4),
    ('transport', 'Overtime available?', 'YesNo', 5),

    -- Planners
    ('planner', 'Full planning service?', 'YesNo', 1),
    ('planner', 'Partial planning service?', 'YesNo', 2),
    ('planner', 'Day-of coordination?', 'YesNo', 3),
    ('planner', 'Vendor booking included?', 'YesNo', 4),
    ('planner', 'Budget management offered?', 'YesNo', 5),

    -- Fashion
    ('fashion', 'Rental available?', 'YesNo', 1),
    ('fashion', 'Purchase available?', 'YesNo', 2),
    ('fashion', 'Custom tailoring?', 'YesNo', 3),
    ('fashion', 'Alterations included?', 'YesNo', 4),
    ('fashion', 'Accessories included?', 'YesNo', 5),

    -- Stationery
    ('stationery', 'Custom designs available?', 'YesNo', 1),
    ('stationery', 'Matching sets offered?', 'YesNo', 2),
    ('stationery', 'Rush orders accepted?', 'YesNo', 3),
    ('stationery', 'Delivery available?', 'YesNo', 4),
    ('stationery', 'Eco-friendly materials?', 'YesNo', 5);

    PRINT 'Inserted category-specific questions for all categories';
END
ELSE
BEGIN
    PRINT 'Category questions already exist';
END
GO

-- 5. Create stored procedure to get category questions
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetCategoryQuestions')
BEGIN
    DROP PROCEDURE sp_GetCategoryQuestions;
    PRINT 'Dropped existing sp_GetCategoryQuestions';
END
GO

CREATE PROCEDURE sp_GetCategoryQuestions
    @Category NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        QuestionID,
        Category,
        QuestionText,
        QuestionType,
        Options,
        IsRequired,
        DisplayOrder
    FROM CategoryQuestions 
    WHERE Category = @Category AND IsActive = 1
    ORDER BY DisplayOrder ASC;
END;
GO
PRINT 'Created sp_GetCategoryQuestions stored procedure';

-- 6. Create stored procedure to save additional details
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_SaveVendorAdditionalDetails')
BEGIN
    DROP PROCEDURE sp_SaveVendorAdditionalDetails;
    PRINT 'Dropped existing sp_SaveVendorAdditionalDetails';
END
GO

CREATE PROCEDURE sp_SaveVendorAdditionalDetails
    @VendorProfileID INT,
    @AdditionalDetailsJSON NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Delete existing additional details for this vendor
        DELETE FROM VendorAdditionalDetails 
        WHERE VendorProfileID = @VendorProfileID;
        
        -- Parse and insert new additional details
        IF @AdditionalDetailsJSON IS NOT NULL AND @AdditionalDetailsJSON != '' AND @AdditionalDetailsJSON != '[]'
        BEGIN
            INSERT INTO VendorAdditionalDetails (VendorProfileID, QuestionID, Answer)
            SELECT 
                @VendorProfileID,
                CAST(JSON_VALUE(value, '$.questionId') AS INT),
                JSON_VALUE(value, '$.answer')
            FROM OPENJSON(@AdditionalDetailsJSON)
            WHERE JSON_VALUE(value, '$.questionId') IS NOT NULL 
            AND JSON_VALUE(value, '$.answer') IS NOT NULL
            AND JSON_VALUE(value, '$.questionId') != ''
            AND JSON_VALUE(value, '$.answer') != '';
        END;
        
        COMMIT TRANSACTION;
        
        SELECT 1 as Success, 'Additional details saved successfully' as Message;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT 0 as Success, ERROR_MESSAGE() as Message;
    END CATCH
END;
GO
PRINT 'Created sp_SaveVendorAdditionalDetails stored procedure';

-- 7. Create stored procedure to get vendor summary data
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_GetVendorSummary')
BEGIN
    DROP PROCEDURE sp_GetVendorSummary;
    PRINT 'Dropped existing sp_GetVendorSummary';
END
GO

CREATE PROCEDURE sp_GetVendorSummary
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Basic vendor information
    SELECT 
        vp.BusinessName,
        vp.DisplayName,
        vp.BusinessEmail,
        vp.BusinessPhone,
        vp.Website,
        vp.BusinessDescription,
        vp.Tagline,
        vp.YearsInBusiness,
        vp.Address,
        vp.City,
        vp.State,
        vp.Country,
        vp.PostalCode,
        vp.AdditionalCitiesServed,
        vp.FeaturedImageURL,
        vp.AcceptingBookings,
        vp.AverageResponseTime
    FROM VendorProfiles vp
    WHERE vp.VendorProfileID = @VendorProfileID;
    
    -- Categories
    SELECT Category 
    FROM VendorCategories 
    WHERE VendorProfileID = @VendorProfileID;
    
    -- Images count
    SELECT COUNT(*) as ImageCount
    FROM VendorImages 
    WHERE VendorProfileID = @VendorProfileID;
    
    -- Services count
    SELECT COUNT(*) as ServiceCount
    FROM Services s
    INNER JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID
    WHERE sc.VendorProfileID = @VendorProfileID;
    
    -- Packages count
    SELECT COUNT(*) as PackageCount
    FROM Packages 
    WHERE VendorProfileID = @VendorProfileID;
    
    -- Social media links
    SELECT Platform, URL 
    FROM VendorSocialMedia 
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY DisplayOrder;
    
    -- Business hours
    SELECT 
        DayOfWeek,
        OpenTime,
        CloseTime,
        IsAvailable
    FROM VendorBusinessHours 
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY DayOfWeek;
    
    -- Additional details with questions
    SELECT 
        cq.QuestionText,
        vad.Answer,
        cq.Category
    FROM VendorAdditionalDetails vad
    INNER JOIN CategoryQuestions cq ON vad.QuestionID = cq.QuestionID
    WHERE vad.VendorProfileID = @VendorProfileID
    ORDER BY cq.Category, cq.DisplayOrder;
    
    -- FAQs
    SELECT Question, Answer 
    FROM VendorFAQs 
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY DisplayOrder;
END;
GO
PRINT 'Created sp_GetVendorSummary stored procedure';

PRINT '';
PRINT '============================================';
PRINT 'Database schema updates completed successfully!';
PRINT 'Tables created: CategoryQuestions, VendorAdditionalDetails';
PRINT 'Column added: VendorProfiles.AdditionalCitiesServed';
PRINT 'Stored procedures created: sp_GetCategoryQuestions, sp_SaveVendorAdditionalDetails, sp_GetVendorSummary';
PRINT 'Category questions inserted for all 13 categories';
PRINT '============================================';
