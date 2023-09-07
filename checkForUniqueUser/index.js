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
        // Get the Email parameter from the request query
        const Email = req.query.Email;

        // Construct the path based on the entered Email
        const absolutePath = `Gyanodaya/Users/${Email}/User.json`;
    
        // Get a block blob client for the specified blob path
        const blockBlobClient = containerClient.getBlockBlobClient(absolutePath);
        
        // Check if the blob with the constructed path exists
        const exists = await blockBlobClient.exists();
        
        if (exists) {
            // If the blob exists, return a 400 Bad Request response
            context.res = {
                status: 400, // Bad Request
                body: "Email already exists"
            };
        } else {
            // If the blob does not exist, return a 200 OK response
            context.res = {
                status: 200, // OK
                body: "Email does not exist, you can proceed"
            };
        }
        
    } catch (error) {
        // Handle any errors that occur during the execution of the function
        console.error("Error:", error);
        context.res = {
            status: 500, // Internal Server Error
            body: "An error occurred while processing your request."
        };
    }
};
