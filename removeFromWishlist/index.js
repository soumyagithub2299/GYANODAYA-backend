const { ContainerClient, StorageSharedKeyCredential } = require("@azure/storage-blob");

module.exports = async function (context, req) {
  const accountName = "YOUR_STORAGE_ACCOUNT_NAME";
  const accountKey = "YOUR_STORAGE_ACCOUNT_KEY";
  const blobURL = "YOUR_CONTAINER_URL";

  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
  const containerClient = new ContainerClient(blobURL, sharedKeyCredential);

  // Function to convert a readable stream to text
  async function streamToText(readable) {
    readable.setEncoding("utf8");
    let data = "";
    for await (const chunk of readable) {
      data += chunk;
    }
    return data;
  }

  // Function to download a blob from the container
  async function blobDownload(AbsolutePath) {
    const blobclient = containerClient.getBlockBlobClient(AbsolutePath);
    let downloadBlockBlobResponse = await blobclient.download();
    let downloaded = await streamToText(
      downloadBlockBlobResponse.readableStreamBody
    );
    return downloaded;
  }

  // Function to upsert data into a blob
  async function upsertData(content, AbsolutePath) {
    const blockBlobClient = containerClient.getBlockBlobClient(AbsolutePath);
    try {
      await blockBlobClient.upload(content, content.length);
      return true;
    } catch (error) {
      console.log("error", error);
      return false; // Handle the error gracefully
    }
  }

  try {
    let ID = req.query.ID;
    let Email = req.query.Email;
    let responseMessage = { data: {} };

    if (!ID || !Email) {
      throw new Error("Missing 'ID' or 'Email' parameter in the request.");
    }

    // Construct the absolute path based on 'Email' and 'ID' query parameters
    const absolutePath = `Gyanodaya/Users/${Email}/Wishlist.json`;

    // Download the JSON data from the blob
    const downloadedData = await blobDownload(absolutePath);
    const data = JSON.parse(downloadedData);

    // Find the index of the item with the specified 'ID'
    const index = data.findIndex((obj) => obj.ID == ID);

    if (index >= 0) {
      // Remove the item from the array
      data.splice(index, 1);

      // Convert the updated data back to JSON
      const updatedData = JSON.stringify(data);

      // Upsert the updated data
      const response = await upsertData(updatedData, absolutePath);

      if (response) {
        responseMessage.data = data;
        responseMessage.message = `Item with ID ${ID} has been successfully deleted.`;
      }
    }

    context.res = {
      body: responseMessage,
    };
  } catch (error) {
    console.error("Error:", error.message);
    context.res = {
      status: 500, // Internal Server Error
      body: { error: error.message },
    };
  }
};
