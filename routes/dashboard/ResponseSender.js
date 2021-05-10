module.exports = {
    sendSuccess: (res, responseMessage = null, responseDataKeyName = null, responseData = null) => {
        let responseObject = {};
        if (responseDataKeyName) {
            responseObject = {
                status: true,
                message: responseMessage,
                success: true,
                [responseDataKeyName]: responseData
            }
        } else {
            responseObject = {
                status: true,
                message: responseMessage,
                success: true
            }
        }
        res.status(200).json(responseObject);
    }, sendInvalidRequest: (res, errorMessage, error) => {
        let responseObject = {
            status: false,
            message: errorMessage,
            success: false,
            error
        };
        res.status(400).json(responseObject);
    },
    sendUnathorized: (res, errorMessage, error) => {
        let responseObject = {
            status: false,
            message: errorMessage,
            success: false,
            error
        };
        res.status(401).json(responseObject);
    },
    sendDBError: (res, errorMessage, error) => {
        let messageSecondPart = "Unkown Error";
        if (error) {
            if (error.errors) {
                messageSecondPart = JSON.stringify(error.errors);
                if (error.errors[0]) {
                    messageSecondPart = JSON.stringify(error.errors[0]);
                    if (error.errors[0].message)
                        messageSecondPart = error.errors[0].message
                }
            }
        }
        let responseObject = {
            status: false,
            message: errorMessage + ", " + messageSecondPart,
            success: false,
            error
        };
        res.status(500).json(responseObject);
    }
}