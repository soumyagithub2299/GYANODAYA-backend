const { ContainerClient, StorageSharedKeyCredential } = require("@azure/storage-blob");

module.exports = async function (context, req) {
    // Replace these values with your actual Azure Storage account information
    const accountName = "YOUR_STORAGE_ACCOUNT_NAME";
    const accountKey = "YOUR_STORAGE_ACCOUNT_KEY";
    const blobURL = "YOUR_CONTAINER_URL";

    // Create a shared key credential using your storage account information
    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

    // Create a container client using the container URL and shared key credential
    const containerClient = new ContainerClient(blobURL, sharedKeyCredential);

    // Helper function to check if a blob path exists within the container
    async function pathExists(path) {
        const blobClient = containerClient.getBlockBlobClient(path);
        return await blobClient.exists();
    }

    // Helper function to convert a readable stream to text
    async function streamToText(readable) {
        readable.setEncoding("utf8");
        let data = "";
        for await (const chunk of readable) {
            data += chunk;
        }
        return data;
    }

    // Helper function to upload data to a blob
    async function uploadData(content, path) {
        const blockBlobClient = containerClient.getBlockBlobClient(path);
        try {
            if (!(await blockBlobClient.exists())) {
                await blockBlobClient.upload(content, content.length);
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.log("error", error);
        }
    }

    // Helper function to upsert (update or insert) data into a blob
    async function upsertData(content, path) {
        const blockBlobClient = containerClient.getBlockBlobClient(path);
        try {
            if (await blockBlobClient.exists()) {
                await blockBlobClient.upload(content, content.length);
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.log("error", error);
        }
    }

    // Helper function to download data from a blob
    async function blobDownload(absolutePath) {
        const blobClient = containerClient.getBlockBlobClient(absolutePath);
        let downloadBlockBlobResponse = await blobClient.download(0);
        let downloaded = await streamToText(
            await downloadBlockBlobResponse.readableStreamBody
        );
        try {
            return downloaded;
        } catch {
            return downloaded;
        }
    }

    // Extract data from the request body
    const { Query, Email } = req.body;

    let responseMessage = { data: {} };

    try {
        if (Query && Email) {
            const absolutePath = `Gyanodaya/Users/${Email}/Queries.json`;

            if (!(await pathExists(absolutePath))) {
                // Create a new query entry
                let queryData = {
                    Query
                };

                const content = JSON.stringify([queryData]);
                let response = await uploadData(content, absolutePath);

                if (response === true) {
                    responseMessage.data = queryData;
                } else {
                    responseMessage.data = [];
                    responseMessage.msg = "Data not saved.";
                }
            } else {
                let downloadedData = await blobDownload(absolutePath);
                const data = JSON.parse(downloadedData);
                let newQueryData = {
                    Query
                };

                data.push(newQueryData);

                const finalData = JSON.stringify(data);
                let response = await upsertData(finalData, absolutePath);
                if (response === true) {
                    responseMessage.data = newQueryData;
                } else {
                    responseMessage.data = [];
                    responseMessage.msg = "Data not saved.";
                }
            }
        }

        // Set the HTTP response body with a success message
        context.res = {
            body: { message: "Query created Successfully......!" },
        };
    } catch (error) {
        // Handle errors and set an appropriate error response
        console.log("error", error);
        context.res = {
            status: 500,
            body: { message: "Something went wrong." },
        };
    }
};
