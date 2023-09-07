const {
  ContainerClient,
  StorageSharedKeyCredential,
} = require("@azure/storage-blob");

const { v4: uuidv4 } = require("uuid");

module.exports = async function (context, req) {
  // Replace these values with your actual Azure Storage account information
  const accountName = "YOUR_STORAGE_ACCOUNT_NAME";
  const accountKey = "YOUR_STORAGE_ACCOUNT_KEY";
  const blobURL = "YOUR_CONTAINER_URL";

  // Create a shared key credential using your storage account information
  const sharedKeyCredential = new StorageSharedKeyCredential(
    accountName,
    accountKey
  );
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

  const { Email, Name, Password, ConfirmPassword, Gender } = req.body;

  let responseMessage = { data: {} };

  try {
    if (Email && Name && Password && ConfirmPassword && Gender) {
      // Construct the path based on the entered Email
      const absolutePath = `Gyanodaya/Users/${Email}/User.json`;

      // Check if the user data with the given Email already exists
      if (await pathExists(absolutePath)) {
        responseMessage.data = [];
        responseMessage.msg = "Email already exists.";
      } else {
        // Generate a unique 6-character ID from UUID
        let userData = {
          ID: uuidv4().substring(0, 6),
          Email,
          Name,
          Password,
          ConfirmPassword,
          Gender,
        };

        const content = JSON.stringify([userData]);
        let response = await uploadData(content, absolutePath);

        if (response === true) {
          responseMessage.data = userData;
        } else {
          responseMessage.data = [];
          responseMessage.msg = "Data not saved.";
        }
      }
    }
    // Set the HTTP response body with the result message
    context.res = {
      body: responseMessage,
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
