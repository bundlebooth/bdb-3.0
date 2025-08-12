// ============================================
// UPDATED VENDOR ENDPOINTS WITH NEW FEATURES
// Additional Cities/Regions, Category Questions, Enhanced Summary
// ============================================

// Update Step 2: Location Information to include Additional Cities
router.post('/setup/step2-location', async (req, res) => {
  try {
    const {
      vendorProfileId,
      address,
      city,
      state,
      country,
      postalCode,
      latitude,
      longitude,
      serviceAreas,
      serviceRadius,
      additionalCitiesServed // NEW FIELD
    } = req.body;

    // Validation
    if (!vendorProfileId || !address || !city || !state || !postalCode) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: address, city, state, postalCode'
      });
    }

    const pool = await poolPromise;
    
    // Update vendor profile with location including additional cities
    const updateRequest = new sql.Request(pool);
    updateRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    updateRequest.input('Address', sql.NVarChar, address);
    updateRequest.input('City', sql.NVarChar, city);
    updateRequest.input('State', sql.NVarChar, state);
    updateRequest.input('Country', sql.NVarChar, country || 'USA');
    updateRequest.input('PostalCode', sql.NVarChar, postalCode);
    updateRequest.input('Latitude', sql.Decimal(10, 8), latitude || null);
    updateRequest.input('Longitude', sql.Decimal(11, 8), longitude || null);
    updateRequest.input('AdditionalCitiesServed', sql.NVarChar, additionalCitiesServed || null); // NEW
    
    await updateRequest.query(`
      UPDATE VendorProfiles 
      SET Address = @Address, City = @City, State = @State, 
          Country = @Country, PostalCode = @PostalCode,
          Latitude = @Latitude, Longitude = @Longitude,
          AdditionalCitiesServed = @AdditionalCitiesServed,
          UpdatedAt = GETDATE()
      WHERE VendorProfileID = @VendorProfileID
    `);
    
    // Handle service areas (existing logic)
    if (serviceAreas && serviceAreas.length > 0) {
      // Delete existing service areas
      await updateRequest.query(`
        DELETE FROM VendorServiceAreas WHERE VendorProfileID = @VendorProfileID
      `);
      
      // Insert new service areas
      for (const area of serviceAreas) {
        const areaRequest = new sql.Request(pool);
        areaRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        areaRequest.input('City', sql.NVarChar, area.city);
        areaRequest.input('State', sql.NVarChar, area.state || state);
        areaRequest.input('Country', sql.NVarChar, area.country || country || 'USA');
        areaRequest.input('RadiusMiles', sql.Int, serviceRadius || 25);
        areaRequest.input('AdditionalFee', sql.Decimal(10, 2), area.additionalFee || 0);
        
        await areaRequest.query(`
          INSERT INTO VendorServiceAreas (VendorProfileID, City, State, Country, RadiusMiles, AdditionalFee)
          VALUES (@VendorProfileID, @City, @State, @Country, @RadiusMiles, @AdditionalFee)
        `);
      }
    }
    
    res.json({
      success: true,
      message: 'Location information saved successfully',
      step: 2,
      nextStep: 3
    });
    
  } catch (err) {
    console.error('Step 2 setup error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to save location information',
      error: err.message
    });
  }
});

// ============================================
// NEW ENDPOINTS FOR CATEGORY-SPECIFIC QUESTIONS
// ============================================

// Get category-specific questions
router.get('/category-questions/:category', async (req, res) => {
  try {
    const { category } = req.params;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('Category', sql.NVarChar(50), category);

    const result = await request.execute('sp_GetCategoryQuestions');
    
    res.json({
      success: true,
      questions: result.recordset,
      category: category
    });

  } catch (err) {
    console.error('Category questions error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get category questions',
      error: err.message
    });
  }
});

// NEW: Step 7 - Additional Details (Category-specific questions)
router.post('/setup/step7-additional-details', async (req, res) => {
  try {
    const {
      vendorProfileId,
      additionalDetails
    } = req.body;

    if (!vendorProfileId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor profile ID is required'
      });
    }

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);
    request.input('AdditionalDetailsJSON', sql.NVarChar(sql.MAX), JSON.stringify(additionalDetails) || null);

    const result = await request.execute('sp_SaveVendorAdditionalDetails');
    
    if (result.recordset[0].Success) {
      res.json({
        success: true,
        message: 'Additional details saved successfully',
        step: 7,
        nextStep: 8
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.recordset[0].Message
      });
    }

  } catch (err) {
    console.error('Step 7 additional details error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to save additional details',
      error: err.message
    });
  }
});

// NEW: Get vendor summary for final step
router.get('/setup/summary/:vendorProfileId', async (req, res) => {
  try {
    const { vendorProfileId } = req.params;

    if (!vendorProfileId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor profile ID is required'
      });
    }

    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('VendorProfileID', sql.Int, vendorProfileId);

    const result = await request.execute('sp_GetVendorSummary');
    
    const summary = {
      basicInfo: result.recordsets[0][0] || {},
      categories: result.recordsets[1] || [],
      imageCount: result.recordsets[2][0]?.ImageCount || 0,
      serviceCount: result.recordsets[3][0]?.ServiceCount || 0,
      packageCount: result.recordsets[4][0]?.PackageCount || 0,
      socialMedia: result.recordsets[5] || [],
      businessHours: result.recordsets[6] || [],
      additionalDetails: result.recordsets[7] || [],
      faqs: result.recordsets[8] || []
    };

    res.json({
      success: true,
      summary: summary
    });

  } catch (err) {
    console.error('Vendor summary error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get vendor summary',
      error: err.message
    });
  }
});

// Updated Step 8: FAQ Section (renamed from Step 10)
router.post('/setup/step8-faq', async (req, res) => {
  try {
    const {
      vendorProfileId,
      faqs
    } = req.body;

    if (!vendorProfileId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor profile ID is required'
      });
    }

    const pool = await poolPromise;
    
    // Handle FAQs
    if (faqs && faqs.length > 0) {
      // Delete existing FAQs
      const deleteRequest = new sql.Request(pool);
      deleteRequest.input('VendorProfileID', sql.Int, vendorProfileId);
      await deleteRequest.query(`
        DELETE FROM VendorFAQs WHERE VendorProfileID = @VendorProfileID
      `);
      
      // Insert new FAQs
      for (let i = 0; i < faqs.length; i++) {
        const faqRequest = new sql.Request(pool);
        faqRequest.input('VendorProfileID', sql.Int, vendorProfileId);
        faqRequest.input('Question', sql.NVarChar, faqs[i].question);
        faqRequest.input('Answer', sql.NVarChar, faqs[i].answer);
        faqRequest.input('DisplayOrder', sql.Int, i);
        
        await faqRequest.query(`
          INSERT INTO VendorFAQs (VendorProfileID, Question, Answer, DisplayOrder)
          VALUES (@VendorProfileID, @Question, @Answer, @DisplayOrder)
        `);
      }
    }
    
    res.json({
      success: true,
      message: 'FAQ section saved successfully',
      step: 8,
      nextStep: 9
    });
    
  } catch (err) {
    console.error('Step 8 FAQ error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to save FAQ section',
      error: err.message
    });
  }
});

// Updated Step 9: Final Summary & Completion
router.post('/setup/step9-completion', async (req, res) => {
  try {
    const { vendorProfileId } = req.body;

    if (!vendorProfileId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor profile ID is required'
      });
    }

    const pool = await poolPromise;
    
    // Mark setup as completed
    const updateRequest = new sql.Request(pool);
    updateRequest.input('VendorProfileID', sql.Int, vendorProfileId);
    
    await updateRequest.query(`
      UPDATE VendorProfiles 
      SET IsCompleted = 1, UpdatedAt = GETDATE()
      WHERE VendorProfileID = @VendorProfileID
    `);
    
    res.json({
      success: true,
      message: 'Vendor setup completed successfully! Your profile is now live.',
      step: 9,
      completed: true
    });
    
  } catch (err) {
    console.error('Step 9 completion error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to complete vendor setup',
      error: err.message
    });
  }
});
