const { ContainerClient, StorageSharedKeyCredential } = require("@azure/storage-blob");

module.exports = async function (context, req) {
    // Replace these values with your actual Azure Storage account information
    const accountName = "YOUR_STORAGE_ACCOUNT_NAME";
    const accountKey = "YOUR_STORAGE_ACCOUNT_KEY";
    const containerURL = "YOUR_CONTAINER_URL";
    
    // Create a shared key credential using your storage account information
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    
    // Create a container client using the container URL and shared key credential
    const containerClient = new ContainerClient(containerURL, sharedKeyCredential);
    
    // Helper function to convert a readable stream to text
    async function streamToText(readable) {
        readable.setEncoding('utf8');
        let data = '';
        for await (const chunk of readable) {
            data += chunk;
        }
        return data;
    }
    
    try {
        // Extract the 'Email' and 'Password' query parameters from the request
        const Email = req.query.Email;
        const Password = req.query.Password;

        // Check if the 'Email' and 'Password' query parameters are missing
        if (!Email || !Password) {
            context.res = {
                status: 400, // Bad Request
                body: "Email and Password query parameters are required."
            };
            return;
        }

        // Construct the path to the user's JSON data based on the provided Email
        const absolutePath = `Gyanodaya/Users/${Email}/User.json`;
    
        // Create a block blob client for the specified blob
        const blockBlobClient = containerClient.getBlockBlobClient(absolutePath);
        
        // Download the blob data
        const downloadBlockBlobResponse = await blockBlobClient.download(0);
        
        // Convert the downloaded data stream to text
        const data = await streamToText(downloadBlockBlobResponse.readableStreamBody);
    
        // Parse the JSON content of the blob data
        const content = JSON.parse(data);
        
        let found = false;
        
        // Search for a user with the matching 'Email' and 'Password'
        for (const item of content) {
            if (item.Email === Email && item.Password === Password) {
                found = true;
                // Set the HTTP response body with the found user data
                context.res = {
                    body: { data: item }
                };
                break; // Exit the loop when a match is found
            }
        }
        
        // If no matching user is found, return a 400 Bad Request response
        if (!found) {
            console.error("User not found:", Email);
            context.res = {
                status: 400, // Bad Request
                body: "User not found. Please check your credentials."
            };
        }
        
    } catch (error) {
        console.error("Error:", error);
        // Handle errors and set an appropriate error response
        context.res = {
            status: 500, // Internal Server Error
            body: "An error occurred while processing your request."
        };
    }
};
