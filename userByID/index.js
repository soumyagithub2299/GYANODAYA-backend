const { ContainerClient, StorageSharedKeyCredential } = require("@azure/storage-blob");

module.exports = async function (context, req) {
    // Azure Storage account and container information
    const accountName = "YOUR_STORAGE_ACCOUNT_NAME";
    const accountKey = "YOUR_STORAGE_ACCOUNT_KEY";
    const containerURL = "YOUR_CONTAINER_URL";

    // Initialize Azure Storage credentials and container client
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    const containerClient = new ContainerClient(containerURL, sharedKeyCredential);

    // Function to convert a readable stream to text
    async function streamToText(readable) {
        readable.setEncoding('utf8');
        let data = '';
        for await (const chunk of readable) {
            data += chunk;
        }
        return data;
    }

    try {
        // Extract Email and ID from query parameters
        const Email = req.query.Email;
        const ID = req.query.ID;

        // Check if both Email and ID are provided in the request
        if (!Email || !ID) {
            context.res = {
                status: 400, // Bad Request
                body: "Both Email and ID query parameters are required."
            };
            return;
        }

        // Construct the absolute path to the user data JSON file
        const absolutePath = `Gyanodaya/Users/${Email}/User.json`;

        // Get the blob client and download the JSON content
        const blockBlobClient = containerClient.getBlockBlobClient(absolutePath);
        const downloadBlockBlobResponse = await blockBlobClient.download(0);
        const data = await streamToText(downloadBlockBlobResponse.readableStreamBody);

        // Parse the JSON content
        const content = JSON.parse(data);

        let found = false;

        if (content) {
            // Find the user with the specified ID
            const user = content.find(item => item.ID === ID);
            if (user) {
                found = true;
                context.res = {
                    body: { data: user }
                };
            }
        }

        // Handle the case where the user is not found
        if (!found) {
            console.error("User not found:", Email, "with ID:", ID);
            context.res = {
                status: 404, // Not Found
                body: "User not found"
            };
        }

    } catch (error) {
        console.error("Error:", error);
        context.res = {
            status: 500, // Internal Server Error
            body: "An error occurred while processing your request."
        };
    }
};
