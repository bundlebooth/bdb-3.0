-- Section 5: Reviews and Ratings

-- ProviderReviews table
CREATE TABLE ProviderReviews (
    ReviewID INT IDENTITY(1,1) PRIMARY KEY,
    ProviderID INT NOT NULL,
    UserID INT NOT NULL,
    BookingID INT NULL,
    Rating TINYINT NOT NULL, -- 1-5
    ReviewText NVARCHAR(MAX) NULL,
    ReviewDate DATETIME NOT NULL DEFAULT GETDATE(),
    IsApproved BIT NOT NULL DEFAULT 0,
    ResponseText NVARCHAR(MAX) NULL,
    ResponseDate DATETIME NULL,
    CONSTRAINT FK_ProviderReviews_ProviderID FOREIGN KEY (ProviderID) REFERENCES ServiceProviders(ProviderID),
    CONSTRAINT FK_ProviderReviews_UserID FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT FK_ProviderReviews_BookingID FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID),
    CONSTRAINT CK_ProviderReviews_Rating CHECK (Rating BETWEEN 1 AND 5)
);
GO
-- ReviewCategories table (for detailed ratings)
CREATE TABLE ReviewCategories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    ProviderTypeID INT NOT NULL,
    CategoryName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT FK_ReviewCategories_ProviderTypeID FOREIGN KEY (ProviderTypeID) REFERENCES ProviderTypes(TypeID)
);
GO
-- ReviewCategoryRatings table
CREATE TABLE ReviewCategoryRatings (
    RatingID INT IDENTITY(1,1) PRIMARY KEY,
    ReviewID INT NOT NULL,
    CategoryID INT NOT NULL,
    Rating TINYINT NOT NULL, -- 1-5
    CONSTRAINT FK_ReviewCategoryRatings_ReviewID FOREIGN KEY (ReviewID) REFERENCES ProviderReviews(ReviewID),
    CONSTRAINT FK_ReviewCategoryRatings_CategoryID FOREIGN KEY (CategoryID) REFERENCES ReviewCategories(CategoryID),
    CONSTRAINT CK_ReviewCategoryRatings_Rating CHECK (Rating BETWEEN 1 AND 5)
);
GO
