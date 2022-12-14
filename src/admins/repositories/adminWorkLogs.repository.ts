import { SearchWorkLogsDto } from './../dto/searchWorkLogs.dto';
import { WorkLogs } from '../entities/workLogs.entity';
import { EntityRepository, Repository } from 'typeorm';

@EntityRepository(WorkLogs)
export class AdminWorkLogsRepository extends Repository<WorkLogs> {
  getWorkLogsList(searchWorkLogsDto: SearchWorkLogsDto) {
    const { workTypes, processTypes, perPage, page } = searchWorkLogsDto;
    console.log(processTypes);
    const queryBuilder = this.createQueryBuilder('workLogs')
      .innerJoinAndSelect('workLogs.admin', 'admin')
      .innerJoinAndSelect('workLogs.workTypes', 'workTypes')
      .innerJoinAndSelect('workLogs.processTypes', 'processTypes')
      .orderBy('workLogs.createdAt', 'DESC')
      .offset((page - 1) * perPage)
      .limit(perPage);
    if (workTypes) queryBuilder.andWhere('workTypes.workLogId = :workLogId', { workLogId: workTypes });
    if (processTypes) queryBuilder.andWhere('processTypes.processId = :processId', { processId: processTypes });
    return queryBuilder.getMany();
  }
}
