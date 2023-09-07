const { ContainerClient, StorageSharedKeyCredential } = require("@azure/storage-blob");

module.exports = async function (context, req) {
    // Azure Storage account details
    const accountName = "YOUR_STORAGE_ACCOUNT_NAME";
    const accountKey = "YOUR_STORAGE_ACCOUNT_KEY";
    const containerURL = "YOUR_CONTAINER_URL"; // e.g., "https://yourstorage.blob.core.windows.net/yourcontainer"

    // Create a shared key credential using your account name and account key
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

    // Create a container client
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
        // Get the email from the query parameters
        const Email = req.query.Email;

        // Check if the Email parameter is provided
        if (!Email) {
            context.res = {
                status: 400, // Bad Request
                body: "Email query parameter is required."
            };
            return;
        }

        // Construct the absolute path to the user's JSON file in Blob Storage
        const absolutePath = `Gyanodaya/Users/${Email}/User.json`;

        // Get the block blob client for the specified path
        const blockBlobClient = containerClient.getBlockBlobClient(absolutePath);

        // Download the JSON data from the blob
        const downloadBlockBlobResponse = await blockBlobClient.download(0);
        const data = await streamToText(downloadBlockBlobResponse.readableStreamBody);

        // Parse the JSON content
        const content = JSON.parse(data);

        let found = false;

        // Iterate through the content to find a user with the matching email
        for (const item of content) {
            if (item.Email === Email) {
                found = true;
                context.res = {
                    body: { data: item }
                };
                break; // Exit the loop when a match is found
            }
        }

        // If no user is found with the provided email
        if (!found) {
            console.error("User not found:", Email);
            context.res = {
                status: 404, // Not Found
                body: "User not found. Please enter an existing user's details."
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
