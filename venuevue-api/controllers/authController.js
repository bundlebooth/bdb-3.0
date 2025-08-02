const db = require('../config/db');
const { generateToken, hashPassword, comparePassword } = require('../config/auth');

const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Call your stored procedure for user creation
    const query = `
      DECLARE @UserID INT;
      EXEC sp_User_Create
        @Email = '${email}',
        @PasswordHash = '${hashedPassword}',
        @FirstName = '${firstName}',
        @LastName = '${lastName}',
        @UserID = @UserID OUTPUT;
      SELECT @UserID AS UserID;
    `;
    
    const result = await db.executeQuery(query);
    const userId = result.rows[0].UserID.value;
    
    // Get the created user
    const userQuery = `
      SELECT u.*, r.RoleName 
      FROM Users u
      JOIN UserRoleMappings m ON u.UserID = m.UserID
      JOIN UserRoles r ON m.RoleID = r.RoleID
      WHERE u.UserID = ${userId}
    `;
    
    const userResult = await db.executeQuery(userQuery);
    const user = userResult.rows[0];
    
    // Generate token
    const token = generateToken(user);
    
    res.json({
      success: true,
      token,
      user: {
        id: user.UserID.value,
        email: user.Email.value,
        firstName: user.FirstName.value,
        lastName: user.LastName.value,
        role: user.RoleName.value
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Get user from database
    const query = `
      SELECT u.*, r.RoleName 
      FROM Users u
      JOIN UserRoleMappings m ON u.UserID = m.UserID
      JOIN UserRoles r ON m.RoleID = r.RoleID
      WHERE u.Email = '${email}'
    `;
    
    const result = await db.executeQuery(query);
    
    if (!result.rows.length) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isMatch = await comparePassword(password, user.PasswordHash.value);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = generateToken(user);
    
    res.json({
      success: true,
      token,
      user: {
        id: user.UserID.value,
        email: user.Email.value,
        firstName: user.FirstName.value,
        lastName: user.LastName.value,
        role: user.RoleName.value
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  register,
  login
};
