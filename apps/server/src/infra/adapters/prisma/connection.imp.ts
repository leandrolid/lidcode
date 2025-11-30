import { ErrorCode } from '@domain/enums/error-code.enum'
import type { IDatabaseConnection } from '@domain/persistence/connection'
import { ConflictError, InternalServerError, Logger, NotFoundError } from '@lidcode/framework'
import { PrismaErrorCode } from '@infra/adapters/prisma/error-code'
import { Prisma, PrismaClient } from '@prisma/client'
import { camel, get } from 'radash'

export class PrismaDatabaseConnection implements IDatabaseConnection {
  private readonly logger: Logger = new Logger('Query')
  private readonly prisma: PrismaClient

  static #instance: PrismaDatabaseConnection
  static getInstance(): PrismaDatabaseConnection {
    if (!PrismaDatabaseConnection.#instance) {
      PrismaDatabaseConnection.#instance = new PrismaDatabaseConnection()
    }
    return PrismaDatabaseConnection.#instance
  }

  constructor() {
    this.prisma = new PrismaClient({
      log: [{ level: 'query', emit: 'event' }, 'error', 'info', 'warn'],
    }).$on('query', (e) => {
      this.logger.info(`${this.prepareQuery(e.query, JSON.parse(e.params))}`)
    })
  }

  async connect(): Promise<void> {
    try {
      await this.prisma.$connect()
      this.logger.info('Database connection established successfully.')
    } catch (error) {
      this.logger.error(error)
      throw new InternalServerError('Failed to connect to the database.')
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect()
      this.logger.info('Database connection closed successfully.')
    } catch (error) {
      this.logger.error(error)
      throw new InternalServerError('Failed to disconnect from the database.')
    }
  }

  async query<
    Model extends Prisma.ModelName,
    Action extends Prisma.PrismaAction,
    Operations extends Prisma.TypeMap['model'][Model]['operations'],
  >(
    model: Model,
    action: Action,
    // @ts-expect-error -- Prisma does not support generics for args and result types
    data: Operations[Action]['args'],
    // @ts-expect-error -- Prisma does not support generics for args and result types
  ): Promise<Operations[Action]['result']> {
    try {
      const command = get<Function>(this.prisma, `${camel(model)}.${action}`)
      if (!command) {
        throw new InternalServerError(`Command ${action} not found for model ${model}.`)
      }
      const result = await command(data)
      return result
    } catch (error) {
      this.logger.error(error)
      if (this.isKnownError(error) && error.code === PrismaErrorCode.AUTHENTICATION_FAILED) {
        throw new InternalServerError('Falha de autenticação ao acessar o banco de dados.')
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.CANT_REACH_DATABASE_SERVER) {
        throw new InternalServerError('Não foi possível alcançar o servidor de banco de dados.')
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.DATABASE_SERVER_TIMEOUT) {
        throw new InternalServerError(
          'O servidor de banco de dados está indisponível ou demorando muito para responder.',
        )
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.DATABASE_NOT_EXIST) {
        throw new InternalServerError('O banco de dados não existe.')
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.OPERATIONS_TIMED_OUT) {
        throw new InternalServerError('Operação no banco de dados expirou.')
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.DATABASE_ALREADY_EXISTS) {
        throw new InternalServerError('O banco de dados já existe.')
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.USER_DENIED_ACCESS) {
        throw new InternalServerError('Usuário não tem permissão para acessar o banco de dados.')
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.TLS_CONNECTION_ERROR) {
        throw new InternalServerError('Erro de conexão TLS com o banco de dados.')
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.SCHEMA_VALIDATION_ERROR) {
        throw new InternalServerError('Erro de validação do esquema do banco de dados.')
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.INVALID_DATABASE_STRING) {
        throw new InternalServerError('String de conexão com o banco de dados inválida.')
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.UNDERLYING_KIND_NOT_EXIST) {
        throw new InternalServerError('O tipo subjacente não existe no banco de dados.')
      }
      if (
        this.isKnownError(error) &&
        error.code === PrismaErrorCode.UNSUPPORTED_FEATURES_FOR_DB_VERSION
      ) {
        throw new InternalServerError('Recursos não suportados para a versão do banco de dados.')
      }
      if (
        this.isKnownError(error) &&
        error.code === PrismaErrorCode.RAW_QUERY_INCORRECT_PARAMETERS
      ) {
        throw new InternalServerError('Parâmetros incorretos na consulta bruta.')
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.SERVER_CLOSED_CONNECTION) {
        throw new InternalServerError('Conexão com o servidor foi fechada.')
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.VALUE_TOO_LONG) {
        throw new InternalServerError('Valor fornecido é muito longo para o campo.')
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.RECORD_NOT_FOUND) {
        throw new NotFoundError(`Recurso "${model}" não encontrado.`)
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.UNIQUE_CONSTRAINT_FAILED) {
        throw new ConflictError(`Recurso "${model}" já existe.`)
      }
      if (
        this.isKnownError(error) &&
        error.code === PrismaErrorCode.FOREIGN_KEY_CONSTRAINT_FAILED
      ) {
        throw new ConflictError(`Recurso "${model}" vinculado a outros.`, {
          code: ErrorCode.FOREIGN_KEY_CONSTRAINT,
        })
      }
      if (
        this.isKnownError(error) &&
        error.code === PrismaErrorCode.CONSTRAINT_FAILED_ON_DATABASE
      ) {
        throw new ConflictError(`Restrição falhou no banco de dados para o recurso "${model}".`)
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.INVALID_FIELD_VALUE) {
        throw new InternalServerError(`Valor de campo inválido para o recurso "${model}".`)
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.INVALID_PROVIDED_VALUE) {
        throw new InternalServerError(`Valor fornecido inválido para o recurso "${model}".`)
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.DATA_VALIDATION_ERROR) {
        throw new InternalServerError(`Erro de validação de dados para o recurso "${model}".`)
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.QUERY_PARSE_FAILED) {
        throw new InternalServerError(`Erro ao analisar a consulta para o recurso "${model}".`)
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.QUERY_VALIDATION_FAILED) {
        throw new InternalServerError(`Erro de validação da consulta para o recurso "${model}".`)
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.RAW_QUERY_FAILED) {
        throw new InternalServerError(`Erro na consulta bruta para o recurso "${model}".`)
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.NULL_CONSTRAINT_VIOLATION) {
        throw new InternalServerError(`Violação de restrição nula para o recurso "${model}".`)
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.MISSING_REQUIRED_VALUE) {
        throw new InternalServerError(`Valor obrigatório ausente para o recurso "${model}".`)
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.MISSING_REQUIRED_ARGUMENT) {
        throw new InternalServerError(`Argumento obrigatório ausente para o recurso "${model}".`)
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.REQUIRED_RELATION_VIOLATION) {
        throw new InternalServerError(`Violação de relação obrigatória para o recurso "${model}".`)
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.RELATED_RECORD_NOT_FOUND) {
        throw new NotFoundError(`Registro relacionado não encontrado para o recurso "${model}".`)
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.QUERY_INTERPRETATION_ERROR) {
        throw new InternalServerError(
          `Erro de interpretação da consulta para o recurso "${model}".`,
        )
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.RELATION_NOT_CONNECTED) {
        throw new InternalServerError(`Relação não conectada para o recurso "${model}".`)
      }
      if (
        this.isKnownError(error) &&
        error.code === PrismaErrorCode.REQUIRED_CONNECTED_RECORDS_NOT_FOUND
      ) {
        throw new NotFoundError(
          `Registros conectados obrigatórios não encontrados para o recurso "${model}".`,
        )
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.INPUT_ERROR) {
        throw new InternalServerError(`Erro de entrada para o recurso "${model}".`)
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.VALUE_OUT_OF_RANGE) {
        throw new InternalServerError(`Valor fora do intervalo para o recurso "${model}".`)
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.TABLE_NOT_EXIST) {
        throw new InternalServerError(`Tabela não existe para o recurso "${model}".`)
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.COLUMN_NOT_EXIST) {
        throw new InternalServerError(`Coluna não existe para o recurso "${model}".`)
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.INCONSISTENT_COLUMN_DATA) {
        throw new InternalServerError(`Dados de coluna inconsistentes para o recurso "${model}".`)
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.CONNECTION_POOL_TIMEOUT) {
        throw new InternalServerError(`Tempo limite de pool de conexões para o recurso "${model}".`)
      }
      if (
        this.isKnownError(error) &&
        error.code === PrismaErrorCode.OPERATION_DEPENDS_ON_MISSING_RECORDS
      ) {
        throw new NotFoundError(`Recurso "${model}" não encontrado.`)
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.FEATURE_NOT_SUPPORTED) {
        throw new InternalServerError(
          `Recurso "${model}" não suportado na versão atual do banco de dados.`,
        )
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.MULTIPLE_DATABASE_ERRORS) {
        throw new InternalServerError(
          `Múltiplos erros de banco de dados para o recurso "${model}".`,
        )
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.TRANSACTION_API_ERROR) {
        throw new InternalServerError(`Erro na API de transação para o recurso "${model}".`)
      }
      if (
        this.isKnownError(error) &&
        error.code === PrismaErrorCode.QUERY_PARAMETER_LIMIT_EXCEEDED
      ) {
        throw new InternalServerError(
          `Limite de parâmetros de consulta excedido para o recurso "${model}".`,
        )
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.FULLTEXT_INDEX_NOT_FOUND) {
        throw new InternalServerError(
          `Índice de texto completo não encontrado para o recurso "${model}".`,
        )
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.NUMBER_NOT_FIT_64BIT) {
        throw new InternalServerError(`Número não cabe em 64 bits para o recurso "${model}".`)
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.TRANSACTION_DEADLOCK) {
        throw new InternalServerError(`Deadlock de transação para o recurso "${model}".`)
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.ASSERTION_VIOLATION) {
        throw new InternalServerError(`Violação de asserção para o recurso "${model}".`)
      }
      if (this.isKnownError(error) && error.code === PrismaErrorCode.EXTERNAL_CONNECTOR_ERROR) {
        throw new InternalServerError(`Erro de conector externo para o recurso "${model}".`)
      }
      if (
        this.isKnownError(error) &&
        error.code === PrismaErrorCode.TOO_MANY_DATABASE_CONNECTIONS
      ) {
        throw new InternalServerError(
          `Muitas conexões de banco de dados para o recurso "${model}".`,
        )
      }
      throw new InternalServerError(`Erro ao executar a operação no recurso "${model}".`)
    }
  }

  private isKnownError(error: any): error is Prisma.PrismaClientKnownRequestError {
    return error instanceof Prisma.PrismaClientKnownRequestError
  }

  private prepareQuery(query: string, parameters?: any[]) {
    if (!Array.isArray(parameters) || parameters.length === 0) return query
    const paramNames = query.match(/\$(\d+)/g)
    if (!paramNames) return query
    const paramValues = parameters.reduce(
      (acc, param, index) => {
        acc[`$${index + 1}`] = this.prepareParam(param)
        return acc
      },
      {} as Record<string, string>,
    )
    return paramNames.reduce((acc, paramName) => {
      const paramValue = paramValues[paramName]
      if (paramValue !== undefined) {
        acc = acc.replace(paramName, paramValue)
      }
      return acc
    }, query)
  }

  private prepareParam(param: any) {
    if (typeof param === 'object') return JSON.stringify(param)
    if (typeof param === 'number') return param
    return `'${param}'`
  }
}
