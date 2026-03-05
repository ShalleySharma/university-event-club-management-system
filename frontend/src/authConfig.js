export const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_AZURE_CLIENT_ID || "YOUR_CLIENT_ID",
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_AZURE_TENANT_ID || "YOUR_TENANT_ID"}`,
    redirectUri: "http://localhost:5000/auth/microsoft/callback"
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false
  }
};

export const loginRequest = {
  scopes: ["User.Read"]
};

// Microsoft OAuth callback handler for frontend
export const handleMsalCallback = (msalInstance) => {
  return msalInstance.handleRedirectPromise().then(async (tokenResponse) => {
    if (tokenResponse) {
      // Token response contains access token
      const account = tokenResponse.account;
      
      // Send the token to backend for verification and session creation
      const response = await fetch("http://localhost:5000/api/auth/microsoft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          accessToken: tokenResponse.accessToken,
          account: account
        })
      });

      const data = await response.json();
      return data;
    }
    return null;
  });
};
