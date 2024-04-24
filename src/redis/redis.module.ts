import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { createClient } from 'redis';

// global装饰器 在app.module里import一下全局都能使用
@Global()
@Module({
  providers: [
    RedisService,
    {
      provide: 'REDIS_CLIENT',
      async useFactory() { 
        const client = createClient({
          socket: {
            host: 'localhost',
            port: 6379
          },
          database: 1
        })
        await client.connect()
        return client
      }

    }
  ],
  exports: [RedisService]
})
export class RedisModule {}
