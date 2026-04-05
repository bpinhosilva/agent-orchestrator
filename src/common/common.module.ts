import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { FileSystemStorageService } from './filesystem-storage.service';
import { StoragePathHelper } from './storage-path.helper';

@Global()
@Module({
  providers: [
    {
      provide: StorageService,
      useClass: FileSystemStorageService,
    },
    StoragePathHelper,
  ],
  exports: [StorageService, StoragePathHelper],
})
export class CommonModule {}
