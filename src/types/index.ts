import { ParameterizedContext } from "koa"
import winston from "winston"

export interface CustomContext extends ParameterizedContext {
  log: winston.Logger
  requestId: string
}

export interface CustomState {}