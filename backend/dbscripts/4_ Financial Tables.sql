-- Section 4: Financial Tables

-- PaymentMethods table
CREATE TABLE PaymentMethods (
    MethodID INT IDENTITY(1,1) PRIMARY KEY,
    MethodName NVARCHAR(50) NOT NULL,
    IsOnline BIT NOT NULL DEFAULT 1,
    ProcessingFeePercent DECIMAL(5, 2) NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT UQ_PaymentMethods_MethodName UNIQUE (MethodName)
);
GO
-- Payments table
CREATE TABLE Payments (
    PaymentID INT IDENTITY(1,1) PRIMARY KEY,
    BookingID INT NULL,
    UserID INT NOT NULL,
    ProviderID INT NULL,
    Amount DECIMAL(18, 2) NOT NULL,
    PaymentDate DATETIME NOT NULL DEFAULT GETDATE(),
    MethodID INT NOT NULL,
    TransactionID NVARCHAR(255) NULL,
    Status NVARCHAR(20) NOT NULL, -- Pending, Completed, Failed, Refunded
    FeeAmount DECIMAL(18, 2) NOT NULL DEFAULT 0,
    NetAmount DECIMAL(18, 2) NOT NULL,
    Notes NVARCHAR(MAX) NULL,
    CONSTRAINT FK_Payments_BookingID FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID),
    CONSTRAINT FK_Payments_UserID FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT FK_Payments_ProviderID FOREIGN KEY (ProviderID) REFERENCES ServiceProviders(ProviderID),
    CONSTRAINT FK_Payments_MethodID FOREIGN KEY (MethodID) REFERENCES PaymentMethods(MethodID)
);
GO
-- Payouts table
CREATE TABLE Payouts (
    PayoutID INT IDENTITY(1,1) PRIMARY KEY,
    ProviderID INT NOT NULL,
    Amount DECIMAL(18, 2) NOT NULL,
    PayoutDate DATETIME NOT NULL DEFAULT GETDATE(),
    MethodID INT NOT NULL,
    Status NVARCHAR(20) NOT NULL, -- Pending, Completed, Failed
    TransactionID NVARCHAR(255) NULL,
    FeeAmount DECIMAL(18, 2) NOT NULL DEFAULT 0,
    NetAmount DECIMAL(18, 2) NOT NULL,
    Notes NVARCHAR(MAX) NULL,
    CONSTRAINT FK_Payouts_ProviderID FOREIGN KEY (ProviderID) REFERENCES ServiceProviders(ProviderID),
    CONSTRAINT FK_Payouts_MethodID FOREIGN KEY (MethodID) REFERENCES PaymentMethods(MethodID)
);
GO
-- Invoices table
CREATE TABLE Invoices (
    InvoiceID INT IDENTITY(1,1) PRIMARY KEY,
    BookingID INT NOT NULL,
    InvoiceNumber NVARCHAR(50) NOT NULL,
    IssueDate DATE NOT NULL DEFAULT GETDATE(),
    DueDate DATE NOT NULL,
    Status NVARCHAR(20) NOT NULL, -- Draft, Sent, Paid, Overdue, Cancelled
    Subtotal DECIMAL(18, 2) NOT NULL,
    TaxAmount DECIMAL(18, 2) NOT NULL DEFAULT 0,
    TotalAmount DECIMAL(18, 2) NOT NULL,
    AmountPaid DECIMAL(18, 2) NOT NULL DEFAULT 0,
    BalanceDue DECIMAL(18, 2) NOT NULL,
    PDFPath NVARCHAR(255) NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT FK_Invoices_BookingID FOREIGN KEY (BookingID) REFERENCES Bookings(BookingID),
    CONSTRAINT UQ_Invoices_InvoiceNumber UNIQUE (InvoiceNumber)
);
GO
-- TaxRates table
CREATE TABLE TaxRates (
    TaxRateID INT IDENTITY(1,1) PRIMARY KEY,
    Country NVARCHAR(100) NOT NULL,
    StateProvince NVARCHAR(100) NULL,
    City NVARCHAR(100) NULL,
    TaxName NVARCHAR(100) NOT NULL,
    Rate DECIMAL(5, 4) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    EffectiveFrom DATE NOT NULL DEFAULT GETDATE(),
    EffectiveTo DATE NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL
);
GO
-- PricingTiers table
CREATE TABLE PricingTiers (
    TierID INT IDENTITY(1,1) PRIMARY KEY,
    ProviderID INT NULL,
    ProviderTypeID INT NULL,
    TierName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255) NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    PriceMultiplier DECIMAL(5, 2) NOT NULL DEFAULT 1.00,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT FK_PricingTiers_ProviderID FOREIGN KEY (ProviderID) REFERENCES ServiceProviders(ProviderID),
    CONSTRAINT FK_PricingTiers_ProviderTypeID FOREIGN KEY (ProviderTypeID) REFERENCES ProviderTypes(TypeID),
    CONSTRAINT CK_PricingTiers_DateRange CHECK (EndDate >= StartDate)
);
GO
