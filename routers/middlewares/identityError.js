const CustomError = require('./customError');

function indentityError(error, requireCode, invalidCode) {
    if (error.name && error.name === 'CastError') {
        if (error.kind === 'required') return new CustomError(requireCode || 70008, error.path);
        if (error.path) return new CustomError(invalidCode || 70006, error.path);
    }
    // handle error throw from mongoose validate
    if (error.name !== undefined && error.name === 'ValidationError') {
        if (error.errors) {
            // eslint-disable-next-line no-restricted-syntax
            for (const fieldError in error.errors) {
                if (error.errors[fieldError]) {
                    if (error.errors[fieldError].kind === 'required')
                        return new CustomError(requireCode || 70008, fieldError);
                    if (error.errors[fieldError].name === 'CastError')
                        return new CustomError(invalidCode || 70006, fieldError);
                    return error.errors[fieldError].reason;
                }
            }
        }
    }
    return error;
}

module.exports = indentityError;
