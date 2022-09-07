import { CacheInterceptor, CACHE_MANAGER, Inject, Injectable, InternalServerErrorException, NotFoundException, UseInterceptors } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { UserRepository } from './user.repository';
import axios from 'axios';
import { Cache } from 'cache-manager';
import * as crypto from 'crypto';
import * as config from 'config';
import { SMS } from './model/sms.model';

const smsConfig: any = config.get('sms');
const ACCESS_KEY_ID = smsConfig.access_key_id;
const SECRET_KEY = smsConfig.secret_key;
const SERVICE_ID = smsConfig.service_id;
const FROM = smsConfig.from;

@Injectable()
@UseInterceptors(CacheInterceptor)
export class UserService {
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  makeSignitureForSMS(): string {
    const message = [];
    const hmac = crypto.createHmac('sha256', SECRET_KEY);
    const timeStamp = Date.now().toString();
    const space = ' ';
    const newLine = '\n';
    const method = 'POST';
    message.push(method);
    message.push(space);
    message.push(`/sms/v2/services/${SERVICE_ID}/messages`);
    message.push(newLine);
    message.push(timeStamp);
    message.push(newLine);
    message.push(ACCESS_KEY_ID);
    const signiture = hmac.update(message.join('')).digest('base64');
    return signiture.toString();
  }

  makeRand6Num(): number {
    return Math.floor(Math.random() * 1000000);
  }

  async sendSMS(phoneNumber: string): Promise<string> {
    await this.cacheManager.del(phoneNumber);
    const checkNumber = this.makeRand6Num().toString().padStart(6, '0');
    const body: SMS = {
      type: 'SMS',
      contentType: 'COMM',
      countryCode: '82',
      from: FROM,
      content: `인증번호는 [${checkNumber}] 입니다.`,
      messages: [
        {
          to: phoneNumber,
        },
      ],
    };
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'x-ncp-apigw-timestamp': Date.now().toString(),
      'x-ncp-iam-access-key': ACCESS_KEY_ID,
      'x-ncp-apigw-signature-v2': this.makeSignitureForSMS(),
    };
    try {
      const result = await axios.post(`https://sens.apigw.ntruss.com/sms/v2/services/${SERVICE_ID}/messages`, body, { headers });
      if (result.status === 202) {
        await this.cacheManager.set(phoneNumber, checkNumber);
        return checkNumber;
      }
    } catch (err) {
      console.log(err.response.data);
      throw new InternalServerErrorException('인증 메시지를 보내는데 실패하였습니다.');
    }
  }

  async checkSMS(phoneNumber: string, inputNumber: string): Promise<Boolean> {
    const storedNumber = (await this.cacheManager.get(phoneNumber)) as string;
    if (storedNumber === inputNumber) return true;
    else return false;
  }
}
