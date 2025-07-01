// LOGIN USER CONTROLLER

async function loginUser(req, res){
  try {
    const user = await UserModel.findOne({email: req.body.email, password: req.body.password});
    if(!user) return res.status(404).send({success: false, message: "Invalid email or password"})
    res.status(200).send({success: true, message: "Login successful", data: { id: user._id }})
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "An error occured",
      data: error
    })
  }
}

const loginUser = async (credentials) => {
  try {
    setIsLoading(true);
    console.log('Attempting login with:', credentials.email);
    
    // Add request logging
    console.log('Request config:', {
      url: '/api/users/login',
      method: 'post',
      data: credentials
    });

    const response = await api.post('/api/users/login', credentials);
    
    console.log('Login response:', {
      status: response.status,
      data: response.data
    });

    if (response.data?.success) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      console.log('Login successful');
      return { success: true, data: response.data };
    }
    
    throw new Error(response.data?.message || 'Login failed');

  } catch (error) {
    console.error('Full error object:', error);
    
    let errorMessage = 'Login failed';
    if (error.response) {
      // Server responded with error status
      console.error('Error response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
      
      if (error.response.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.response.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
      errorMessage = 'No response from server. Check your connection.';
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
      errorMessage = 'Request configuration error';
    }

    // Clear any invalid auth data
    localStorage.removeItem('token');
    setUser(null);
    
    throw new Error(errorMessage);
  } finally {
    setIsLoading(false);
  }
};


// In your login controller
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');

  // Handle hex format secret consistently
  const signingKey = /^[0-9a-fA-F]{64}$/.test(secret) 
    ? Buffer.from(secret, 'hex') 
    : secret;

  return jwt.sign(
    {
      id: user._id.toString(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    },
    signingKey,
    { algorithm: 'HS256' }
  );
};




