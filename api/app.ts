/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'
import taskRoutes from './routes/tasks.js'
import schedulingRoutes from './routes/scheduling.js'
import materialRoutes from './routes/materials.js'
import safetyRoutes from './routes/safety.js'
import equipmentRoutes from './routes/equipment.js'
import workforceRoutes from './routes/workforce.js'
import statisticsRoutes from './routes/statistics.js'
import floorplanRoutes from './routes/floorplan.js'
import { errorHandler, notFoundHandler } from './middleware/error.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/scheduling', schedulingRoutes)
app.use('/api/materials', materialRoutes)
app.use('/api', safetyRoutes)
app.use('/api', equipmentRoutes)
app.use('/api', workforceRoutes)
app.use('/api/statistics', statisticsRoutes)
app.use('/api/floorplans', floorplanRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use(errorHandler)

/**
 * 404 handler
 */
app.use(notFoundHandler)

export default app
