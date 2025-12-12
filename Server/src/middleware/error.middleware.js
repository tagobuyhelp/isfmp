import { ApiError } from '../utils/apiError.js';

const errorMiddleware = (err, req, res, next) => {
    console.error(err.stack);

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            statusCode: err.statusCode,
            success: false,
            message: err.message,
            errors: err.errors,
        });
    }

    res.status(500).json({
        statusCode: 500,
        success: false,
        message: 'Internal Server Error',
        errors: [err.message],
    });
};

export default errorMiddleware
