import { Request, Response, NextFunction } from 'express'

export class BaseController {
  protected asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next)
    }
  }
  protected getPaginationParams(req: Request) {
    const page = parseInt(req.query.page as string) || 1
    // 支持前端使用的 page_size 参数，兼容 limit 参数
    const limit = parseInt(req.query.page_size as string) || parseInt(req.query.limit as string) || 10
    const offset = (page - 1) * limit
    
    return { page, limit, offset }
  }

  protected getSortParams(req: Request) {
    const sortBy = req.query.sortBy as string || 'id'
    const sortOrder = req.query.sortOrder as string || 'ASC'
    
    return { sortBy, sortOrder }
  }

  protected validateRequired(data: any, fields: string[]): string | null {
    for (const field of fields) {
      if (!data[field]) {
        return `${field} is required`
      }
    }
    return null
  }

  protected success(res: Response, data: any, message: string = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data
    })
  }

  protected created(res: Response, data: any, message: string = 'Created successfully') {
    return res.status(201).json({
      success: true,
      message,
      data
    })
  }

  protected error(res: Response, message: string, statusCode: number = 500) {
    return res.status(statusCode).json({
      success: false,
      message,
      error: true
    })
  }

  protected notFound(res: Response, message: string = 'Resource not found') {
    return res.status(404).json({
      success: false,
      message,
      error: true
    })
  }

  protected paginated<T>(res: Response, data: T[], pagination: any) {
    const totalPages = pagination.pages || pagination.totalPages;
    return res.status(200).json({
      success: true,
      data,
      pagination: {
        total: pagination.total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1
      }
    })
  }

  protected serverError(res: Response, error: any) {
    console.error('Server Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: true
    })
  }
}