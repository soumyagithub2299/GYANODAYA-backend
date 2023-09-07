const { ContainerClient, StorageSharedKeyCredential } = require("@azure/storage-blob");
const { v4: uuidv4 } = require("uuid");

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
    async function uploadData(content) {
        const absolutePath = "Gyanodaya/Products.json";
        const blockBlobClient = containerClient.getBlockBlobClient(absolutePath);
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
    async function upsertData(content) {
        const absolutePath = "Gyanodaya/Products.json";
        const blockBlobClient = containerClient.getBlockBlobClient(absolutePath);
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
    const { Name, Subject, Price, Description } = req.body;

    let responseMessage = { data: {} };

    try {
        if (Name && Subject && Price && Description) {
            const absolutePath = "Gyanodaya/Products.json";

            if (!(await pathExists(absolutePath))) {
                // Create a new product with a unique ID
                let productData = {
                    ID: uuidv4().substring(0, 6),
                    Name,
                    Subject,
                    Price,
                    Description
                };

                const content = JSON.stringify([productData]);
                let response = await uploadData(content);

                if (response === true) {
                    responseMessage.data = productData;
                } else {
                    responseMessage.data = [];
                    responseMessage.msg = "Data not saved.";
                }
            } else {
                let downloadedData = await blobDownload(absolutePath);
                const data = JSON.parse(downloadedData);
                let newProductData = {
                    ID: uuidv4().substring(0, 6),
                    Name,
                    Subject,
                    Price,
                    Description
                };

                data.push(newProductData);

                const finalData = JSON.stringify(data);
                let response = await upsertData(finalData);
                if (response === true) {
                    responseMessage.data = newProductData;
                } else {
                    responseMessage.data = [];
                    responseMessage.msg = "Data not saved.";
                }
            }
        }

        // Set the HTTP response body with a success message
        context.res = {
            body: { message: "Hurray! Product created Successfully......!" },
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
