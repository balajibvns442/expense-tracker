exports.validate = (schema) => {
    return (req,res,next) => {
        const { error } = schema.validate(req.body) ;

        if( error ){
            return res.status(400).json(
                { error : error.details[0].message }
            );
        }

        next() ;
    }
};

// Rejects invalid data early

// Prevents SQL junk

// Prevents logical corruption

// Reduces controller complexity

// Becomes enterprise-style API