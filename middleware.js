/**
 * @file Defines all routes for middleware.
 */

import pkg from 'validator';
const { escape} = pkg;


export const asyncWrapper = fn => (req,res,next)=> {
    return Promise.resolve(fn(req, res,next)).catch(next);
}

//  adds sanitiser 
export const sanitizeInput = (req,res, next) => {
    for(const key in req.body){
        if(Object.hasOwnProperty.call(req.body,key)){
            req.body[key] = escape(req.body[key])
        }
    }
    next()
}
