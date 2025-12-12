CREATE TABLE [dbo].[CategoryQuestions] (
    [QuestionID]   INT            IDENTITY (1, 1) NOT NULL,
    [Category]     NVARCHAR (50)  NOT NULL,
    [QuestionText] NVARCHAR (500) NOT NULL,
    [QuestionType] NVARCHAR (20)  DEFAULT ('YesNo') NOT NULL,
    [Options]      NVARCHAR (MAX) NULL,
    [IsRequired]   BIT            DEFAULT ((1)) NOT NULL,
    [DisplayOrder] INT            DEFAULT ((0)) NOT NULL,
    [IsActive]     BIT            DEFAULT ((1)) NOT NULL,
    [CreatedAt]    DATETIME2 (7)  DEFAULT (getdate()) NOT NULL,
    [UpdatedAt]    DATETIME2 (7)  DEFAULT (getdate()) NOT NULL,
    PRIMARY KEY CLUSTERED ([QuestionID] ASC)
);


GO

