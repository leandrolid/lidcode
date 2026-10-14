import { CleanupSharesUsecase } from '@app/usecases/shares/cleanup-shares.usecase'
import { CreateShareUsecase } from '@app/usecases/shares/create-share.usecase'
import { DeleteShareUsecase } from '@app/usecases/shares/delete-share.usecase'
import { DownloadFileUsecase } from '@app/usecases/shares/download-file.usecase'
import { GetShareUsecase } from '@app/usecases/shares/get-share.usecase'
import { PurgeShareUsecase } from '@app/usecases/shares/purge-share.usecase'
import { DatabaseClient, DrizzleModuleProvider } from '@infra/adapters/drizzle/client'
import { HttpExceptionFilter } from '@infra/adapters/nest/error-handler'
import { CreateShareController } from '@infra/controllers/create-share/create-share.controller'
import { DeleteShareController } from '@infra/controllers/delete-share/delete-share.controller'
import { DownloadFileController } from '@infra/controllers/download-file/download-file.controller'
import { GetShareController } from '@infra/controllers/get-share/get-share.controller'
import { ExpireSharesCron } from '@infra/crons/expire-shares.cron'
import { ShareRepository } from '@infra/repositories/share/share.repository.imp'
import { FileStorageService } from '@infra/services/file-storage.service.imp'
import { Module } from '@nestjs/common'
import { APP_FILTER, APP_PIPE } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { ZodValidationPipe } from 'nestjs-zod'

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [
    CreateShareController,
    GetShareController,
    DownloadFileController,
    DeleteShareController,
  ],
  providers: [
    DatabaseClient,
    DrizzleModuleProvider,
    CreateShareUsecase,
    GetShareUsecase,
    DownloadFileUsecase,
    DeleteShareUsecase,
    PurgeShareUsecase,
    CleanupSharesUsecase,
    ExpireSharesCron,
    { provide: 'IShareRepository', useClass: ShareRepository },
    { provide: 'IFileStorageService', useClass: FileStorageService },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
