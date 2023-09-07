const { ContainerClient, StorageSharedKeyCredential } = require("@azure/storage-blob");

module.exports = async function (context, req) {
  // Azure Storage account and container information
  const accountName = "YOUR_STORAGE_ACCOUNT_NAME";
  const accountKey = "YOUR_STORAGE_ACCOUNT_KEY";
  const blobURL = "YOUR_CONTAINER_URL";

  // Initialize Azure Storage credentials and container client
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

  // Function to update user data in the JSON content
  async function updateUserData(email, newPassword, newConfirmPassword, content) {
    const userIndex = content.findIndex((user) => user.Email === email);

    if (userIndex >= 0) {
      content[userIndex].Password = newPassword || content[userIndex].Password;
      content[userIndex].ConfirmPassword = newConfirmPassword || content[userIndex].ConfirmPassword;
      return true;
    }

    return false;
  }

  // Extract email, newPassword, and newConfirmPassword from the request
  const email = req.query.Email;
  const newPassword = req.body.Password;
  const newConfirmPassword = req.body.ConfirmPassword;

  try {
    // Construct the absolute path to the user data JSON file
    const absolutePath = `Gyanodaya/Users/${email}/User.json`;

    // Get the blob client and download the JSON content
    const blockBlobClient = containerClient.getBlockBlobClient(absolutePath);
    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    const data = await streamToText(downloadBlockBlobResponse.readableStreamBody);
    const content = JSON.parse(data);

    // Update user data
    const updated = await updateUserData(email, newPassword, newConfirmPassword, content);

    if (updated) {
      // Serialize the updated data back to JSON
      const updatedPassword = JSON.stringify(content);

      // Upload the updated JSON back to the blob
      await blockBlobClient.upload(updatedPassword, updatedPassword.length);

      context.res = {
        body: { message: "User data updated successfully" },
      };
    } else {
      context.res = {
        status: 404,
        body: { message: "User not found" },
      };
    }
  } catch (error) {
    console.log("error", error);
    context.res = {
      status: 500,
      body: { message: "Internal server error" },
    };
  }
};
