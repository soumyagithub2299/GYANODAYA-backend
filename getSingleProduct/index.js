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
        // Extract the 'ID' query parameter from the request
        const ID = req.query.ID;

        // Check if the 'ID' query parameter is missing
        if (!ID) {
            context.res = {
                status: 400, // Bad Request
                body: "ID query parameter is required."
            };
            return;
        }

        // Define the path of the blob containing the products data
        const absolutePath = "Gyanodaya/Products.json";
    
        // Create a block blob client for the specified blob
        const blockBlobClient = containerClient.getBlockBlobClient(absolutePath);
        
        // Download the blob data
        const downloadBlockBlobResponse = await blockBlobClient.download(0);
        
        // Convert the downloaded data stream to text
        const data = await streamToText(downloadBlockBlobResponse.readableStreamBody);
    
        // Parse the JSON content of the blob data
        const content = JSON.parse(data);
        
        let found = false;
        
        // Search for a product with the matching 'ID'
        for (const item of content) {
            if (item.ID === ID) {
                found = true;
                // Set the HTTP response body with the found product data
                context.res = {
                    body: { data: item }
                };
                break; // Exit the loop when a match is found
            }
        }
        
        // If no matching product is found, return a 400 Bad Request response
        if (!found) {
            console.error("ID not found:", ID);
            context.res = {
                status: 400, // Bad Request
                body: "Please enter a valid ID"
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
