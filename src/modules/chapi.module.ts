import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ChapiController } from '../infrastructure/http/chapi.controller';
import { ChapiAdminController } from '../infrastructure/http/chapi-admin.controller';
import { ProcessEmotionalCheckinUseCase } from '../core/application/chapi/use-cases/process-emotional-checkin.usecase';
import { AnalyzeUserHealthUseCase } from '../core/application/chapi/use-cases/analyze-user-health.usecase';
import { RunHealthMonitoringCronUseCase } from '../core/application/chapi/use-cases/run-health-monitoring-cron.usecase';
import { CHAPI_AGENT } from '../core/application/chapi/ports/out.chapi-agent.port';
import { CHAPI_CONTEXT_MANAGER } from '../core/application/chapi/ports/out.chapi-context.port';
import { HEALTH_MONITOR } from '../core/application/chapi/ports/out.health-monitor.port';
import { HYDRATION_ANALYZER } from '../core/application/hydration/ports/out.hydration-analyzer.port';
import { OpenAIChapiAgent } from '../infrastructure/ai/chapi.agent.openai';
import { OpenAIChapiContextManager } from '../infrastructure/ai/chapi-context.manager.openai';
import { ChapiHealthMonitorService } from '../infrastructure/ai/chapi-health-monitor.service';
import { HydrationAnalyzerService } from '../infrastructure/ai/hydration-analyzer.service';
import { HydrationPrismaRepository } from '../infrastructure/persistence/prisma/hydration.prisma.repository';
import { HYDRATION_REPO } from '../core/application/hydration/ports/out.hydration-repo.port';
import { PROFILE_REPO } from '../core/application/profile/ports/out.profile-repo.port';
import { ProfilesPrismaRepository } from '../infrastructure/persistence/prisma/profiles.prisma.repository';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { PrismaService } from '../infrastructure/database/prisma.service';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [ChapiController, ChapiAdminController],
  providers: [
    ProcessEmotionalCheckinUseCase,
    AnalyzeUserHealthUseCase,
    RunHealthMonitoringCronUseCase,
    { provide: CHAPI_AGENT, useClass: OpenAIChapiAgent },
    { 
      provide: CHAPI_CONTEXT_MANAGER, 
      useFactory: (chapiAgent: OpenAIChapiAgent, prisma: PrismaService) => 
        new OpenAIChapiContextManager(chapiAgent, prisma),
      inject: [CHAPI_AGENT, PrismaService]
    },
    { 
      provide: HEALTH_MONITOR, 
      useFactory: (prisma: PrismaService, hydrationAnalyzer: HydrationAnalyzerService) => 
        new ChapiHealthMonitorService(prisma, hydrationAnalyzer),
      inject: [PrismaService, HYDRATION_ANALYZER]
    },
    { provide: HYDRATION_ANALYZER, useClass: HydrationAnalyzerService },
    { provide: HYDRATION_REPO, useClass: HydrationPrismaRepository },
    { provide: PROFILE_REPO, useClass: ProfilesPrismaRepository },
  ],
  exports: [],
})
export class ChapiModule {}
