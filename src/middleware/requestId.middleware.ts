import { Request, Response, NextFunction } from "express"
import { v4 as uuidv4 } from 'uuid'
import { logger } from "../utils/logger.js"

const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers['x-request-id']) {
    const requestId = uuidv4()

    req.headers['x-request-id'] = requestId

    // log info
    logger.info(`Generated new x-request-id: ${requestId} `)

  } else if (Array.isArray(req.headers['x-request-id'])) {
    req.headers['x-request-id'] = req.headers['x-request-id'][0];
  } next()
}

export default requestIdMiddleware