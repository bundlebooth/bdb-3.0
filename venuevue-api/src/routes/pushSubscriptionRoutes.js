/**
 * Push Subscription Routes
 * 
 * API endpoints for managing push notification subscriptions.
 */

const express = require('express');
const router = express.Router();
const sql = require('mssql');

/**
 * POST /users/:userId/push-subscription
 * Create or update a push subscription for a user
 */
router.post('/users/:userId/push-subscription', async (req, res) => {
  try {
    const { userId } = req.params;
    const { endpoint, p256dhKey, authKey, subscription, deviceName } = req.body;
    
    if (!endpoint || !p256dhKey || !authKey) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: endpoint, p256dhKey, authKey' 
      });
    }
    
    const pool = req.app.get('dbPool');
    
    const result = await pool.request()
      .input('UserID', sql.Int, parseInt(userId))
      .input('Endpoint', sql.NVarChar(500), endpoint)
      .input('P256dhKey', sql.NVarChar(500), p256dhKey)
      .input('AuthKey', sql.NVarChar(500), authKey)
      .input('Subscription', sql.NVarChar(sql.MAX), subscription || JSON.stringify({ endpoint, keys: { p256dh: p256dhKey, auth: authKey } }))
      .input('DeviceName', sql.NVarChar(255), deviceName || null)
      .execute('[users].[sp_PushSubscription_Upsert]');
    
    const subscriptionResult = result.recordset[0];
    
    res.json({
      success: true,
      subscriptionId: subscriptionResult?.SubscriptionID,
      action: subscriptionResult?.Action || 'created'
    });
    
  } catch (error) {
    console.error('[Push Subscription] POST Error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save push subscription',
      error: error.message 
    });
  }
});

/**
 * DELETE /users/:userId/push-subscription
 * Remove a push subscription
 */
router.delete('/users/:userId/push-subscription', async (req, res) => {
  try {
    const { userId } = req.params;
    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required field: endpoint' 
      });
    }
    
    const pool = req.app.get('dbPool');
    
    const result = await pool.request()
      .input('UserID', sql.Int, parseInt(userId))
      .input('Endpoint', sql.NVarChar(500), endpoint)
      .execute('[users].[sp_PushSubscription_Deactivate]');
    
    res.json({
      success: true,
      message: 'Push subscription removed',
      rowsAffected: result.recordset[0]?.RowsAffected || 0
    });
    
  } catch (error) {
    console.error('[Push Subscription] DELETE Error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to remove push subscription',
      error: error.message 
    });
  }
});

/**
 * GET /users/:userId/push-subscriptions
 * Get all push subscriptions for a user
 */
router.get('/users/:userId/push-subscriptions', async (req, res) => {
  try {
    const { userId } = req.params;
    const { activeOnly } = req.query;
    
    const pool = req.app.get('dbPool');
    
    const result = await pool.request()
      .input('UserID', sql.Int, parseInt(userId))
      .input('ActiveOnly', sql.Bit, activeOnly !== 'false' ? 1 : 0)
      .execute('[users].[sp_PushSubscription_GetByUser]');
    
    res.json({
      success: true,
      subscriptions: result.recordset
    });
    
  } catch (error) {
    console.error('[Push Subscription] GET Error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get push subscriptions',
      error: error.message 
    });
  }
});

module.exports = router;
