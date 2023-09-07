const azure = require('azure-storage');

module.exports = async function (context, req) {
    // Extract Email and userEnteredOTP from query parameters
    const Email = req.query.Email;
    const userEnteredOTP = req.query.OTP;

    // Check if both Email and userEnteredOTP are provided in the request
    if (!Email || !userEnteredOTP) {
        context.res = {
            status: 400,
            body: "Please provide both 'Email' and 'OTP' in the query parameters."
        };
        return;
    }

    try {
        // Create an instance of the Azure Table Service with your storage account details
        const tableService = azure.createTableService('YOUR_STORAGE_ACCOUNT_NAME', 'YOUR_STORAGE_ACCOUNT_KEY');
        const tableName = 'soumyaGyanodayaTableForEmailAndOtp'; // Replace with your table name

        // Function to retrieve the stored OTP from Azure Table Storage
        const retrieveEntityAsync = () => {
            return new Promise((resolve, reject) => {
                tableService.retrieveEntity(tableName, 'OTP', Email, (error, result, response) => {
                    if (!error) {
                        const storedOTP = result.OTP._;

                        // Compare the stored OTP with the userEnteredOTP
                        if (storedOTP === userEnteredOTP) {
                            resolve("OTP verification successful.");
                        } else {
                            reject("OTP verification failed. Please check the OTP and try again.");
                        }
                    } else if (error.statusCode === 404) {
                        reject("OTP not found. Please request a new OTP.");
                    } else {
                        reject(`An error occurred: ${error.message}`);
                    }
                });
            });
        };

        // Verify the OTP and handle the result
        const result = await retrieveEntityAsync();

        context.res = {
            status: 200,
            body: result
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: `An error occurred: ${error.message}`
        };
    }
};
