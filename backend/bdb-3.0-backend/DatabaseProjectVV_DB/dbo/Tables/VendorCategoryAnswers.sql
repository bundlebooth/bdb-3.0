CREATE TABLE [dbo].[VendorCategoryAnswers] (
    [AnswerID]        INT            IDENTITY (1, 1) NOT NULL,
    [VendorProfileID] INT            NULL,
    [QuestionID]      INT            NULL,
    [Answer]          NVARCHAR (MAX) NOT NULL,
    [CreatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([AnswerID] ASC),
    FOREIGN KEY ([QuestionID]) REFERENCES [dbo].[CategoryQuestions] ([QuestionID]),
    FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID]),
    CONSTRAINT [UC_VendorCategoryAnswer] UNIQUE NONCLUSTERED ([VendorProfileID] ASC, [QuestionID] ASC)
);


GO

