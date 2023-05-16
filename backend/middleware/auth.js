// Import axios
const axios = require("axios").default;

// Auth0 ManagementAPI Token
async function getManagementToken(){
  var options = {
    method: 'POST',
    url: 'https://dev-lbh35xzftxelxza1.us.auth0.com/oauth/token',
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    data: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: 'ZOFyCniuZ1GI85bzfhbnq6Wl0SLQiRb2',
      client_secret: 'AXIyKkwvJr-Oh62VNvIkAwI8y5jiq-7TTOc_3YFqYkZJzAQHJdrvBP5GoTBNHJv6',
      audience: 'https://dev-lbh35xzftxelxza1.us.auth0.com/api/v2/'
    })
  };
  
  var token;
  
  // Make request to Auth0 Management API
  const response = await axios.request(options)
  
  // Get token from response
  token = response.data.access_token;
  
  // Return token
  return token;
}

// Get a user's role
async function getUserRole(user){
  // Fetch the Auth0 Management API token
  var token = await getManagementToken()
  //console.log(token)
  
  // If user is logged in, get their user id
  if(user){
    var userId = user.sub
    
    const options = {
      url: "https://dev-lbh35xzftxelxza1.us.auth0.com/api/v2/users/" + userId,
      method: 'GET',
      headers: { 
        'content-type': 'application/json', 
        'authorization': 'Bearer ' + token
      }
    }
    
    // Make request to Auth0 Management API 
    const response = await axios.request(options)
    
    // Log the user's role
    const role = response.data.app_metadata.role
    // console.log(response.data.app_metadata.role)

    // Return users role
    return role
  } else {
    console.log("No user")
  }
}

// Checks to make sure the user is an admin
async function isAdmin(req, res, next){
  // Get the users role
  var role = await getUserRole(req.oidc.user)

  // Log the users role
  console.log(role)

  // If the user is not an admin, send them a message, else continue to the page
  if(role != 'Admin'){
    res.send('You are not authorized to view this page')
  } else {
    next()
  }
} 

module.exports = isAdmin;