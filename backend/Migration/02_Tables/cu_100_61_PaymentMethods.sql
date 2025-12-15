/*
    Migration Script: Create Table [PaymentMethods]
    Phase: 100 - Tables
    Script: cu_100_61_dbo.PaymentMethods.sql
    Description: Creates the [dbo].[PaymentMethods] table
    
    Execution Order: 61
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[PaymentMethods]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PaymentMethods]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[PaymentMethods](
	[PaymentMethodID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NULL,
	[StripePaymentMethodID] [nvarchar](100) NOT NULL,
	[IsDefault] [bit] NULL,
	[CardBrand] [nvarchar](50) NULL,
	[Last4] [nvarchar](4) NULL,
	[ExpMonth] [int] NULL,
	[ExpYear] [int] NULL,
	[CreatedAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[PaymentMethodID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[PaymentMethods] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[PaymentMethods] already exists. Skipping.';
END
GO
